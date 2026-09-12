import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { InventoryService } from '../inventory/inventory.service';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { AddPurchasePaymentDto } from './dtos/add-payment.dto';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { normalizePaymentMethod } from '../accounts/entities/accounts.entity';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/entities/products.entity';

interface ResolvedPurchaseItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  imeis?: string[];
}

export type PurchaseWithPaymentSummary = Purchase & {
  totalPaid: number;
  currentDue: number;
};

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private itemsRepository: Repository<PurchaseItem>,
    @InjectRepository(PurchasePayment)
    private paymentsRepository: Repository<PurchasePayment>,
    private inventoryService: InventoryService,
    private accountsService: AccountsService,
    private suppliersService: SuppliersService,
    private productsService: ProductsService,
    private dataSource: DataSource,
  ) {}

  private toCents(value: number | string, label: string): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new BadRequestException(`${label} must be a valid amount`);
    }
    const cents = Math.round((numeric + Number.EPSILON) * 100);
    if (Math.abs(numeric - cents / 100) > 1e-9) {
      throw new BadRequestException(
        `${label} cannot have more than 2 decimals`,
      );
    }
    return cents;
  }

  private withPaymentSummary(
    purchase: Purchase,
    payments: PurchasePayment[] = purchase.payments ?? [],
  ): PurchaseWithPaymentSummary {
    const totalCents = this.toCents(purchase.total, 'Purchase total');
    const paidCents = payments.reduce(
      (sum, payment) => sum + this.toCents(payment.amount, 'Purchase payment'),
      0,
    );
    return Object.assign(purchase, {
      totalPaid: paidCents / 100,
      currentDue: Math.max(0, totalCents - paidCents) / 100,
    });
  }

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        Boolean(createPurchaseDto.supplierId) ===
        Boolean(createPurchaseDto.newSupplier)
      ) {
        throw new BadRequestException(
          'Provide either supplierId or newSupplier, but not both',
        );
      }

      let supplierId: string;
      if (createPurchaseDto.newSupplier) {
        const supplier = await this.suppliersService.createPendingInTransaction(
          createPurchaseDto.newSupplier,
          queryRunner.manager,
        );
        supplierId = supplier.id;
      } else {
        if (!createPurchaseDto.supplierId) {
          throw new BadRequestException(
            'Provide either supplierId or newSupplier, but not both',
          );
        }
        const supplier = await queryRunner.manager.findOne(Supplier, {
          where: { id: createPurchaseDto.supplierId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!supplier) throw new NotFoundException('Supplier not found');
        if (!supplier.isActive) {
          throw new BadRequestException(
            'Supplier is pending until their first purchase payment',
          );
        }
        supplierId = supplier.id;
      }

      if (
        !Array.isArray(createPurchaseDto.items) ||
        !createPurchaseDto.items.length
      ) {
        throw new BadRequestException('At least one Product item is required');
      }

      const existingProductIds = createPurchaseDto.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));
      if (new Set(existingProductIds).size !== existingProductIds.length) {
        throw new BadRequestException(
          'The same existing Product cannot be added more than once',
        );
      }

      const existingProducts = existingProductIds.length
        ? await queryRunner.manager
            .getRepository(Product)
            .createQueryBuilder('product')
            .setLock('pessimistic_write')
            .where('product.id IN (:...productIds)', {
              productIds: [...existingProductIds].sort(),
            })
            .andWhere('product."deletedAt" IS NULL')
            .orderBy('product.id', 'ASC')
            .getMany()
        : [];
      const existingProductMap = new Map(
        existingProducts.map((product) => [product.id, product]),
      );
      for (const productId of existingProductIds) {
        const product = existingProductMap.get(productId);
        if (!product) throw new NotFoundException('Product not found');
        if (!product.isActive) {
          throw new BadRequestException(`${product.name} is inactive`);
        }
      }

      const newProductNames = new Set<string>();
      const resolvedItems: ResolvedPurchaseItem[] = [];
      for (const [index, item] of createPurchaseDto.items.entries()) {
        if (Boolean(item.productId) === Boolean(item.newProduct)) {
          throw new BadRequestException(
            `Item ${index + 1}: provide either productId or newProduct, but not both`,
          );
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new BadRequestException(
            `Item ${index + 1} quantity must be a positive whole number`,
          );
        }
        const priceCents = this.toCents(
          item.unitPrice,
          `Item ${index + 1} price`,
        );
        if (priceCents <= 0) {
          throw new BadRequestException(
            `Item ${index + 1} price must be greater than zero`,
          );
        }

        let productId = item.productId;
        if (item.newProduct) {
          const normalizedName = item.newProduct.name
            .trim()
            .toLocaleLowerCase();
          if (!normalizedName) {
            throw new BadRequestException(
              `Item ${index + 1} Product name is required`,
            );
          }
          if (newProductNames.has(normalizedName)) {
            throw new BadRequestException(
              `The new Product ${item.newProduct.name.trim()} is listed more than once`,
            );
          }
          newProductNames.add(normalizedName);
          const product =
            await this.productsService.createForPurchaseInTransaction(
              item.newProduct,
              queryRunner.manager,
            );
          productId = product.id;
        }

        resolvedItems.push({
          productId: productId!,
          quantity: item.quantity,
          unitPrice: priceCents / 100,
          ...(item.imeis
            ? { imeis: item.imeis.map((imei) => imei.trim()) }
            : {}),
        });
      }

      const totalCents = resolvedItems.reduce(
        (sum, item, index) =>
          sum +
          item.quantity *
            this.toCents(item.unitPrice, `Item ${index + 1} price`),
        0,
      );

      const purchase = queryRunner.manager.create(Purchase, {
        invoiceNumber: createPurchaseDto.invoiceNumber,
        supplierId,
        date: createPurchaseDto.date,
        remarks: createPurchaseDto.remarks,
        total: totalCents / 100,
        status: PurchaseStatus.IN_PROGRESS,
      });
      const savedPurchase = await queryRunner.manager.save(purchase);

      for (const item of resolvedItems) {
        await queryRunner.manager.save(
          queryRunner.manager.create(PurchaseItem, {
            purchaseId: savedPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            imeis: item.imeis,
          }),
        );
      }

      await this.inventoryService.receiveStock(
        savedPurchase.id,
        resolvedItems,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return savedPurchase;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<PurchaseWithPaymentSummary[]> {
    const purchases = await this.purchasesRepository.find({
      relations: { supplier: true, payments: true },
      order: { createdAt: 'DESC' },
      withDeleted: true,
    });
    return purchases.map((purchase) => this.withPaymentSummary(purchase));
  }

  async findOne(id: string): Promise<{
    purchase: PurchaseWithPaymentSummary;
    items: PurchaseItem[];
    payments: PurchasePayment[];
  }> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id },
      relations: { supplier: true },
      withDeleted: true,
    });
    if (!purchase) throw new NotFoundException('Purchase not found');

    const items = await this.itemsRepository.find({
      where: { purchaseId: id },
      relations: { product: true },
      withDeleted: true,
    });
    const payments = await this.paymentsRepository.find({
      where: { purchaseId: id },
      relations: { account: true },
      order: { createdAt: 'ASC' },
      withDeleted: true,
    });
    return {
      purchase: this.withPaymentSummary(purchase, payments),
      items,
      payments,
    };
  }

  async addPayment(
    id: string,
    paymentDto: AddPurchasePaymentDto,
  ): Promise<PurchasePayment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const paymentMethod = normalizePaymentMethod(paymentDto.paymentMethod);
      if (!paymentMethod) {
        throw new BadRequestException('Unsupported payment method');
      }
      const purchase = await queryRunner.manager.findOne(Purchase, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!purchase) throw new NotFoundException('Purchase not found');
      if (
        purchase.status !== PurchaseStatus.IN_PROGRESS &&
        purchase.status !== PurchaseStatus.INCOMPLETE
      ) {
        throw new BadRequestException(
          purchase.status === PurchaseStatus.COMPLETED
            ? 'Completed purchase has no outstanding due'
            : 'Cannot add payment to a cancelled purchase',
        );
      }

      const amountCents = this.toCents(paymentDto.amount, 'Paid amount');
      if (amountCents <= 0) {
        throw new BadRequestException('Paid amount must be greater than zero');
      }
      const totalCents = this.toCents(purchase.total, 'Purchase total');
      const previousPaid = await queryRunner.manager
        .getRepository(PurchasePayment)
        .sum('amount', { purchaseId: id });
      const previousPaidCents = this.toCents(previousPaid ?? 0, 'Total paid');
      const outstandingCents = Math.max(0, totalCents - previousPaidCents);
      if (outstandingCents === 0) {
        throw new BadRequestException(
          'Completed purchase has no outstanding due',
        );
      }
      if (amountCents > outstandingCents) {
        throw new BadRequestException(
          `Payment exceeds the outstanding due of ${outstandingCents / 100}`,
        );
      }

      const transactionId = paymentDto.transactionId?.trim() || null;

      if (
        transactionId &&
        (await queryRunner.manager.getRepository(PurchasePayment).exists({
          where: {
            purchaseId: id,
            transactionId,
          },
        }))
      ) {
        throw new BadRequestException(
          'This supplier payment transaction has already been recorded',
        );
      }

      const payment = queryRunner.manager.create(PurchasePayment, {
        ...paymentDto,
        amount: amountCents / 100,
        paymentMethod,
        transactionId,
        purchaseId: id,
      });
      await this.accountsService.recordOutflow(
        queryRunner.manager,
        paymentDto.accountId,
        amountCents / 100,
        paymentMethod,
      );
      const savedPayment = await queryRunner.manager.save(payment);

      const totalPaidCents = previousPaidCents + amountCents;
      purchase.status =
        totalPaidCents === totalCents
          ? PurchaseStatus.COMPLETED
          : PurchaseStatus.INCOMPLETE;
      await queryRunner.manager.save(Purchase, purchase);

      const supplier = await queryRunner.manager.findOne(Supplier, {
        where: { id: purchase.supplierId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');
      if (!supplier.isActive) {
        supplier.isActive = true;
        await queryRunner.manager.save(Supplier, supplier);
      }

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
