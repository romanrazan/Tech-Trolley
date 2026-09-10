import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Customer } from './entities/customers.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

export interface CustomerSummary extends Customer {
  totalSales: number;
  totalPaid: number;
  due: number;
}

export interface CustomerDetails {
  customer: Customer;
  summary: {
    totalSales: number;
    totalPaid: number;
    totalDue: number;
  };
  sales: Array<{
    id: string;
    date: string;
    invoiceNumber: string;
    status: string;
    total: number;
    paidAmount: number;
    remainingDue: number;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      imeis: string[];
    }>;
  }>;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  private duplicatePhoneMessage(): string {
    return 'A customer with this phone already exists, including archived records.';
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

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.createInTransaction(createCustomerDto);
  }

  async createInTransaction(
    createCustomerDto: CreateCustomerDto,
    manager?: EntityManager,
  ): Promise<Customer> {
    return this.createWithStatus(createCustomerDto, true, manager);
  }

  async createPendingInTransaction(
    createCustomerDto: CreateCustomerDto,
    manager: EntityManager,
  ): Promise<Customer> {
    return this.createWithStatus(createCustomerDto, false, manager);
  }

  private async createWithStatus(
    createCustomerDto: CreateCustomerDto,
    isActive: boolean,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repository = manager
      ? manager.getRepository(Customer)
      : this.customersRepository;
    const existing = await repository.findOne({
      where: { phone: createCustomerDto.phone },
      withDeleted: true,
    });
    if (existing) throw new ConflictException(this.duplicatePhoneMessage());

    try {
      const customer = repository.create({ ...createCustomerDto, isActive });
      return await repository.save(customer);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(this.duplicatePhoneMessage());
      }
      throw error;
    }
  }

  async findAll(): Promise<CustomerSummary[]> {
    const rows = await this.dataSource.query<
      Array<
        Customer & {
          totalSales: string;
          totalPaid: string;
          due: string;
        }
      >
    >(`
      SELECT
        customer.*,
        COALESCE(sale_totals.total, 0) AS "totalSales",
        COALESCE(payment_totals.total, 0) AS "totalPaid",
        GREATEST(
          COALESCE(sale_totals.total, 0) -
          COALESCE(payment_totals.total, 0),
          0
        ) AS due
      FROM customer
      LEFT JOIN (
        SELECT "customerId", SUM(total) AS total
        FROM sale
        WHERE status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY "customerId"
      ) sale_totals ON sale_totals."customerId" = customer.id
      LEFT JOIN (
        SELECT sale."customerId", SUM(sale_payment.amount) AS total
        FROM sale_payment
        INNER JOIN sale ON sale.id = sale_payment."saleId"
        WHERE sale.status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY sale."customerId"
      ) payment_totals ON payment_totals."customerId" = customer.id
      WHERE customer."isActive" = true
        AND customer."deletedAt" IS NULL
      ORDER BY customer.name ASC
    `);

    return rows.map((row) => ({
      ...row,
      totalSales: Number(row.totalSales),
      totalPaid: Number(row.totalPaid),
      due: Number(row.due),
    }));
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    if (updateCustomerDto.phone !== customer.phone) {
      const existing = await this.customersRepository.findOne({
        where: { phone: updateCustomerDto.phone },
        withDeleted: true,
      });
      if (existing) throw new ConflictException(this.duplicatePhoneMessage());
    }
    Object.assign(customer, updateCustomerDto);
    try {
      return await this.customersRepository.save(customer);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(this.duplicatePhoneMessage());
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Customer);
      const existingCustomer = await repository.findOne({ where: { id } });
      if (!existingCustomer) throw new NotFoundException('Customer not found');

      const sales = await manager
        .getRepository(Sale)
        .createQueryBuilder('sale')
        .setLock('pessimistic_write')
        .where('sale.customerId = :id', { id })
        .andWhere('sale.status IN (:...statuses)', {
          statuses: [
            SaleStatus.IN_PROGRESS,
            SaleStatus.INCOMPLETE,
            SaleStatus.COMPLETED,
          ],
        })
        .getMany();
      const customer = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      const [dueRow] = await manager.query<Array<{ due: string }>>(
        `
          SELECT COALESCE(SUM(GREATEST(sale.total - COALESCE(payments.paid, 0), 0)), 0) AS due
          FROM sale
          LEFT JOIN (
            SELECT "saleId", SUM(amount) AS paid
            FROM sale_payment
            GROUP BY "saleId"
          ) payments ON payments."saleId" = sale.id
          WHERE sale."customerId" = $1
            AND sale.status IN ('INCOMPLETE', 'COMPLETED')
        `,
        [id],
      );
      const due = Number(dueRow?.due ?? 0);
      if (due > 0) {
        throw new ConflictException(
          `This customer cannot be deleted because ${due.toFixed(2)} is still due.`,
        );
      }
      if (
        sales.some(
          (sale) =>
            sale.status === SaleStatus.IN_PROGRESS ||
            sale.status === SaleStatus.INCOMPLETE,
        )
      ) {
        throw new ConflictException(
          'This customer has an active incomplete sale.',
        );
      }

      await repository.softRemove(customer);
      return { message: 'Customer deleted successfully.' };
    });
  }

  async getDues(id: string): Promise<{ due: number }> {
    await this.findOne(id);
    const rows = await this.dataSource.query<Array<{ due: string }>>(
      `
        SELECT GREATEST(
          COALESCE(SUM(sale.total), 0) -
          COALESCE(SUM(payment_totals.total), 0),
          0
        ) AS due
        FROM sale
        LEFT JOIN (
          SELECT "saleId", SUM(amount) AS total
          FROM sale_payment
          GROUP BY "saleId"
        ) payment_totals ON payment_totals."saleId" = sale.id
        WHERE sale."customerId" = $1
          AND sale.status IN ('INCOMPLETE', 'COMPLETED')
      `,
      [id],
    );
    return { due: Number(rows[0]?.due ?? 0) };
  }

  async getDetails(id: string): Promise<CustomerDetails> {
    const customer = await this.findOne(id);
    const sales = await this.dataSource.getRepository(Sale).find({
      where: {
        customerId: id,
        status: Not(SaleStatus.IN_PROGRESS),
      },
      relations: {
        items: { product: true },
        payments: true,
      },
      withDeleted: true,
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    const history = sales
      .filter((sale) => sale.status !== SaleStatus.IN_PROGRESS)
      .map((sale) => {
        const paidCents = (sale.payments ?? []).reduce(
          (sum, payment) => sum + Math.round(Number(payment.amount) * 100),
          0,
        );
        const totalCents = Math.round(Number(sale.total) * 100);
        const returned = sale.status === SaleStatus.RETURNED;
        return {
          id: sale.id,
          date: sale.date,
          invoiceNumber: sale.invoiceNumber,
          status: sale.status,
          total: totalCents / 100,
          paidAmount: paidCents / 100,
          remainingDue: returned
            ? 0
            : Math.max(0, totalCents - paidCents) / 100,
          items: (sale.items ?? []).map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name ?? 'Unknown product',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            imeis: item.imeis ?? [],
          })),
        };
      });
    const activeSales = history.filter(
      (sale) =>
        sale.status === SaleStatus.INCOMPLETE ||
        sale.status === SaleStatus.COMPLETED,
    );

    return {
      customer,
      summary: {
        totalSales:
          activeSales.reduce(
            (sum, sale) => sum + Math.round(sale.total * 100),
            0,
          ) / 100,
        totalPaid:
          activeSales.reduce(
            (sum, sale) => sum + Math.round(sale.paidAmount * 100),
            0,
          ) / 100,
        totalDue:
          activeSales.reduce(
            (sum, sale) => sum + Math.round(sale.remainingDue * 100),
            0,
          ) / 100,
      },
      sales: history,
    };
  }
}
