import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import {
  Purchase,
  PurchaseStatus,
} from '../purchases/entities/purchase.entity';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { Supplier } from './entities/suppliers.entity';

export interface SupplierSummary extends Supplier {
  totalPurchases: number;
  totalPaid: number;
  due: number;
}

export interface SupplierDetails {
  supplier: Supplier;
  summary: {
    totalPurchases: number;
    totalPaid: number;
    totalDue: number;
  };
  purchases: Array<{
    id: string;
    date: string;
    invoiceNumber: string;
    status: PurchaseStatus;
    total: number;
    paidAmount: number;
    remainingDue: number;
    remarks: string | null;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      imeis: string[];
    }>;
    payments: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      transactionId: string | null;
      date: string;
    }>;
  }>;
}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private duplicateMessage(): string {
    return 'A supplier with this phone or email already exists, including archived records.';
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError: unknown = error.driverError;
    return (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      (driverError as { code?: unknown }).code === '23505'
    );
  }

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.createInTransaction(createSupplierDto);
  }

  async createInTransaction(
    createSupplierDto: CreateSupplierDto,
    manager?: EntityManager,
  ): Promise<Supplier> {
    return this.createWithStatus(createSupplierDto, true, manager);
  }

  async createPendingInTransaction(
    createSupplierDto: CreateSupplierDto,
    manager: EntityManager,
  ): Promise<Supplier> {
    return this.createWithStatus(createSupplierDto, false, manager);
  }

  private async createWithStatus(
    createSupplierDto: CreateSupplierDto,
    isActive: boolean,
    manager?: EntityManager,
  ): Promise<Supplier> {
    const repository = manager
      ? manager.getRepository(Supplier)
      : this.suppliersRepository;
    const existing = await repository.findOne({
      where: [
        { phone: createSupplierDto.phone },
        { email: createSupplierDto.email },
      ],
      withDeleted: true,
    });
    if (existing) throw new ConflictException(this.duplicateMessage());

    try {
      return await repository.save(
        repository.create({ ...createSupplierDto, isActive }),
      );
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(this.duplicateMessage());
      }
      throw error;
    }
  }

  async findAll(): Promise<SupplierSummary[]> {
    const rows = await this.dataSource.query<
      Array<
        Supplier & {
          totalPurchases: string;
          totalPaid: string;
          due: string;
        }
      >
    >(`
      SELECT
        supplier.*,
        COALESCE(purchase_totals.total, 0) AS "totalPurchases",
        COALESCE(payment_totals.total, 0) AS "totalPaid",
        GREATEST(
          COALESCE(purchase_totals.total, 0) -
          COALESCE(payment_totals.total, 0),
          0
        ) AS due
      FROM supplier
      LEFT JOIN (
        SELECT "supplierId", SUM(total) AS total
        FROM purchase
        WHERE status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY "supplierId"
      ) purchase_totals ON purchase_totals."supplierId" = supplier.id
      LEFT JOIN (
        SELECT purchase."supplierId", SUM(purchase_payment.amount) AS total
        FROM purchase_payment
        INNER JOIN purchase ON purchase.id = purchase_payment."purchaseId"
        WHERE purchase.status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY purchase."supplierId"
      ) payment_totals ON payment_totals."supplierId" = supplier.id
      WHERE supplier."isActive" = true
        AND supplier."deletedAt" IS NULL
      ORDER BY supplier.name ASC
    `);

    return rows.map((row) => ({
      ...row,
      totalPurchases: Number(row.totalPurchases),
      totalPaid: Number(row.totalPaid),
      due: Number(row.due),
    }));
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id, isActive: true },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    const phone = updateSupplierDto.phone ?? supplier.phone;
    const email = updateSupplierDto.email ?? supplier.email;
    const duplicate = await this.suppliersRepository.findOne({
      where: [
        { phone, id: Not(id) },
        { email, id: Not(id) },
      ],
      withDeleted: true,
    });
    if (duplicate) {
      throw new ConflictException(this.duplicateMessage());
    }

    Object.assign(supplier, updateSupplierDto);
    try {
      return await this.suppliersRepository.save(supplier);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(this.duplicateMessage());
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Supplier);
      const existingSupplier = await repository.findOne({ where: { id } });
      if (!existingSupplier) throw new NotFoundException('Supplier not found');

      const purchases = await manager
        .getRepository(Purchase)
        .createQueryBuilder('purchase')
        .setLock('pessimistic_write')
        .where('purchase.supplierId = :id', { id })
        .andWhere('purchase.status IN (:...statuses)', {
          statuses: [
            PurchaseStatus.IN_PROGRESS,
            PurchaseStatus.INCOMPLETE,
            PurchaseStatus.COMPLETED,
          ],
        })
        .getMany();
      const supplier = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');
      const [dueRow] = await manager.query<Array<{ due: string }>>(
        `
          SELECT COALESCE(SUM(GREATEST(purchase.total - COALESCE(payments.paid, 0), 0)), 0) AS due
          FROM purchase
          LEFT JOIN (
            SELECT "purchaseId", SUM(amount) AS paid
            FROM purchase_payment
            GROUP BY "purchaseId"
          ) payments ON payments."purchaseId" = purchase.id
          WHERE purchase."supplierId" = $1
            AND purchase.status IN ('INCOMPLETE', 'COMPLETED')
        `,
        [id],
      );
      const due = Number(dueRow?.due ?? 0);
      if (due > 0) {
        throw new ConflictException(
          `This supplier cannot be deleted because ${due.toFixed(2)} is still due.`,
        );
      }
      if (
        purchases.some(
          (purchase) =>
            purchase.status === PurchaseStatus.IN_PROGRESS ||
            purchase.status === PurchaseStatus.INCOMPLETE,
        )
      ) {
        throw new ConflictException(
          'This supplier has an active incomplete purchase.',
        );
      }

      await repository.softRemove(supplier);
      return { message: 'Supplier deleted successfully.' };
    });
  }

  async getDues(id: string): Promise<{ due: number }> {
    await this.findOne(id);
    const rows = await this.dataSource.query<Array<{ due: string }>>(
      `
        SELECT GREATEST(
          COALESCE(SUM(purchase.total), 0) -
          COALESCE(SUM(payment_totals.total), 0),
          0
        ) AS due
        FROM purchase
        LEFT JOIN (
          SELECT "purchaseId", SUM(amount) AS total
          FROM purchase_payment
          GROUP BY "purchaseId"
        ) payment_totals ON payment_totals."purchaseId" = purchase.id
        WHERE purchase."supplierId" = $1
          AND purchase.status IN ('INCOMPLETE', 'COMPLETED')
      `,
      [id],
    );
    return { due: Number(rows[0]?.due ?? 0) };
  }

  async getDetails(id: string): Promise<SupplierDetails> {
    const supplier = await this.findOne(id);
    const purchases = await this.dataSource.getRepository(Purchase).find({
      where: {
        supplierId: id,
        status: In([PurchaseStatus.INCOMPLETE, PurchaseStatus.COMPLETED]),
      },
      relations: {
        items: { product: true },
        payments: true,
      },
      withDeleted: true,
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const history = purchases
      .filter(
        (purchase) =>
          purchase.status === PurchaseStatus.INCOMPLETE ||
          purchase.status === PurchaseStatus.COMPLETED,
      )
      .map((purchase) => {
        const paidCents = (purchase.payments ?? []).reduce(
          (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
          0,
        );
        const totalCents = Math.round(Number(purchase.total) * 100);
        return {
          id: purchase.id,
          date: purchase.date,
          invoiceNumber: purchase.invoiceNumber,
          status: purchase.status,
          total: totalCents / 100,
          paidAmount: paidCents / 100,
          remainingDue: Math.max(0, totalCents - paidCents) / 100,
          remarks: purchase.remarks ?? null,
          items: (purchase.items ?? []).map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name ?? 'Unknown product',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            imeis: item.imeis ?? [],
          })),
          payments: (purchase.payments ?? []).map((payment) => ({
            id: payment.id,
            amount: Number(payment.amount),
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId ?? null,
            date: payment.date,
          })),
        };
      });

    return {
      supplier,
      summary: {
        totalPurchases:
          history.reduce(
            (sum, purchase) => sum + Math.round(purchase.total * 100),
            0,
          ) / 100,
        totalPaid:
          history.reduce(
            (sum, purchase) => sum + Math.round(purchase.paidAmount * 100),
            0,
          ) / 100,
        totalDue:
          history.reduce(
            (sum, purchase) => sum + Math.round(purchase.remainingDue * 100),
            0,
          ) / 100,
      },
      purchases: history,
    };
  }
}
