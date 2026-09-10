import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { CreateSaleDto } from './dtos/create-sale.dto';
import { AddSalePaymentDto } from './dtos/add-payment.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AccountsService } from '../accounts/accounts.service';
import { Customer } from '../customers/entities/customers.entity';
import { CustomersService } from '../customers/customers.service';
import { normalizePaymentMethod } from '../accounts/entities/accounts.entity';
import { UserRole } from '../auth/user-role.enum';

export type SaleWithPaymentSummary = Sale & {
  totalPaid: number;
  currentDue: number;
};

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private itemsRepository: Repository<SaleItem>,
    @InjectRepository(SalePayment)
    private paymentsRepository: Repository<SalePayment>,
    private inventoryService: InventoryService,
    private accountsService: AccountsService,
    private customersService: CustomersService,
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
    sale: Sale,
    payments: SalePayment[] = sale.payments ?? [],
  ): SaleWithPaymentSummary {
    const totalCents = this.toCents(sale.total, 'Sale total');
    const paidCents = payments.reduce(
      (sum, payment) => sum + this.toCents(payment.amount, 'Sale payment'),
      0,
    );
    return Object.assign(sale, {
      totalPaid: paidCents / 100,
      currentDue: Math.max(0, totalCents - paidCents) / 100,
    });
  }

  async create(
    createSaleDto: CreateSaleDto,
    salespersonId: string,
  ): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        Boolean(createSaleDto.customerId) === Boolean(createSaleDto.newCustomer)
      ) {
        throw new BadRequestException(
          'Provide either customerId or newCustomer, but not both',
        );
      }

      const preparedProducts = await this.inventoryService.prepareSaleStock(
        createSaleDto.items,
        queryRunner.manager,
      );

      let customerId: string;
      if (createSaleDto.newCustomer) {
        const customer = await this.customersService.createPendingInTransaction(
          createSaleDto.newCustomer,
          queryRunner.manager,
        );
        customerId = customer.id;
      } else {
        if (!createSaleDto.customerId) {
          throw new BadRequestException(
            'Provide either customerId or newCustomer, but not both',
          );
        }
        const customer = await queryRunner.manager.findOne(Customer, {
          where: { id: createSaleDto.customerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!customer) throw new NotFoundException('Customer not found');
        if (!customer.isActive) {
          throw new BadRequestException(
            'Customer is pending until their first sale payment',
          );
        }
        customerId = customer.id;
      }

      let subTotal = 0;
      for (const item of createSaleDto.items) {
        subTotal += item.quantity * item.unitPrice;
      }

      const total = subTotal - createSaleDto.discount + createSaleDto.vat;
      if (total < 0) {
        throw new BadRequestException('Sale total cannot be negative');
      }

      const sale = queryRunner.manager.create(Sale, {
        invoiceNumber: createSaleDto.invoiceNumber,
        customerId,
        salespersonId,
        date: createSaleDto.date,
        subTotal,
        discount: createSaleDto.discount,
        vat: createSaleDto.vat,
        total,
        status: SaleStatus.IN_PROGRESS,
      });

      const savedSale = await queryRunner.manager.save(sale);

      for (const item of createSaleDto.items) {
        const saleItem = queryRunner.manager.create(SaleItem, {
          saleId: savedSale.id,
          ...item,
        });
        await queryRunner.manager.save(saleItem);
      }

      await this.inventoryService.issueStock(
        savedSale.id,
        createSaleDto.items,
        queryRunner.manager,
        preparedProducts,
      );

      await queryRunner.commitTransaction();
      return savedSale;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<SaleWithPaymentSummary[]> {
    const sales = await this.salesRepository
      .createQueryBuilder('sale')
      .withDeleted()
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.payments', 'payments')
      .orderBy(
        `CASE sale.status
          WHEN :inProgress THEN 0
          WHEN :incomplete THEN 1
          WHEN :completed THEN 2
          WHEN :returned THEN 3
          ELSE 4
        END`,
        'ASC',
      )
      .addOrderBy('sale.createdAt', 'DESC')
      .addOrderBy('sale.date', 'DESC')
      .addOrderBy('sale.invoiceNumber', 'DESC')
      .addOrderBy('sale.id', 'DESC')
      .setParameters({
        inProgress: SaleStatus.IN_PROGRESS,
        incomplete: SaleStatus.INCOMPLETE,
        completed: SaleStatus.COMPLETED,
        returned: SaleStatus.RETURNED,
      })
      .getMany();

    return sales.map((sale) => this.withPaymentSummary(sale));
  }

  async findOne(id: string): Promise<{
    sale: SaleWithPaymentSummary;
    items: SaleItem[];
    payments: SalePayment[];
  }> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: { customer: true },
      withDeleted: true,
    });
    if (!sale) throw new NotFoundException('Sale not found');

    const items = await this.itemsRepository.find({
      where: { saleId: id },
      relations: { product: true },
      withDeleted: true,
    });
    const payments = await this.paymentsRepository.find({
      where: { saleId: id },
      relations: { account: true },
      order: { createdAt: 'ASC' },
      withDeleted: true,
    });

    return { sale: this.withPaymentSummary(sale, payments), items, payments };
  }

  /**
   * Record a customer payment against a sale AND credit the chosen financial
   * account (inflow) in a SINGLE database transaction.
   *
   * Payment, account credit, customer activation, and the status transition
   * commit or roll back together.
   */
  async addPayment(
    id: string,
    paymentDto: AddSalePaymentDto,
    actor: { id: string; role: UserRole },
  ): Promise<SalePayment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) throw new NotFoundException('Sale not found');

      const isAllowedRole =
        actor.role === UserRole.OWNER ||
        actor.role === UserRole.MANAGER ||
        actor.role === UserRole.SALESPERSON;
      const ownsSale =
        actor.role !== UserRole.SALESPERSON || sale.salespersonId === actor.id;
      if (!isAllowedRole || !ownsSale) {
        throw new ForbiddenException(
          actor.role === UserRole.SALESPERSON
            ? 'Salespeople can only record payments for their own sales'
            : 'You are not allowed to record sale payments',
        );
      }

      const paymentMethod = normalizePaymentMethod(paymentDto.paymentMethod);
      if (!paymentMethod) {
        throw new BadRequestException('Unsupported payment method');
      }
      if (
        sale.status !== SaleStatus.IN_PROGRESS &&
        sale.status !== SaleStatus.INCOMPLETE
      ) {
        throw new BadRequestException(
          sale.status === SaleStatus.COMPLETED
            ? 'Completed sale has no outstanding due'
            : 'Cannot add payment to a returned or cancelled sale',
        );
      }

      const amountCents = this.toCents(paymentDto.amount, 'Payment amount');
      if (amountCents <= 0) {
        throw new BadRequestException(
          'Payment amount must be greater than zero',
        );
      }
      const totalCents = this.toCents(sale.total, 'Sale total');
      const previousPaid = await queryRunner.manager
        .getRepository(SalePayment)
        .sum('amount', { saleId: id });
      const previousPaidCents = this.toCents(previousPaid ?? 0, 'Total paid');
      const outstandingCents = Math.max(0, totalCents - previousPaidCents);
      if (outstandingCents === 0) {
        throw new BadRequestException('Completed sale has no outstanding due');
      }
      if (amountCents > outstandingCents) {
        throw new BadRequestException(
          `Payment exceeds the outstanding due of ${outstandingCents / 100}`,
        );
      }

      const transactionId = paymentDto.transactionId?.trim() || null;
      if (
        transactionId &&
        (await queryRunner.manager.getRepository(SalePayment).exists({
          where: { saleId: id, transactionId },
        }))
      ) {
        throw new BadRequestException(
          'This customer payment transaction has already been recorded',
        );
      }

      const payment = queryRunner.manager.create(SalePayment, {
        ...paymentDto,
        amount: amountCents / 100,
        paymentMethod,
        transactionId,
        saleId: id,
      });
      await this.accountsService.recordInflow(
        queryRunner.manager,
        paymentDto.accountId,
        amountCents / 100,
        paymentMethod,
      );
      const savedPayment = await queryRunner.manager.save(payment);

      const totalPaidCents = previousPaidCents + amountCents;
      sale.status =
        totalPaidCents === totalCents
          ? SaleStatus.COMPLETED
          : SaleStatus.INCOMPLETE;
      await queryRunner.manager.save(Sale, sale);

      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: sale.customerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      if (!customer.isActive) {
        customer.isActive = true;
        await queryRunner.manager.save(Customer, customer);
      }

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      if (err instanceof HttpException) throw err;
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await queryRunner.release();
    }
  }
}
