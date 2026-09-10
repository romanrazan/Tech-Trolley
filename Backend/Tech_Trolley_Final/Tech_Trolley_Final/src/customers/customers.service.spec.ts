import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SaleStatus } from '../sales/entities/sale.entity';
import { Customer } from './entities/customers.entity';
import { CustomersService } from './customers.service';

describe('CustomersService details', () => {
  it('returns a clear conflict for a duplicate customer phone', async () => {
    const findOne = jest.fn().mockResolvedValue({
      id: 'existing-customer-id',
      phone: '01700000000',
    });
    const customerRepository = {
      findOne,
    } as unknown as Repository<Customer>;
    const service = new CustomersService(customerRepository, {} as DataSource);

    await expect(
      service.create({
        name: 'Duplicate Customer',
        phone: '01700000000',
      }),
    ).rejects.toEqual(
      new ConflictException(
        'A customer with this phone already exists, including archived records.',
      ),
    );
  });

  it('returns complete product history without counting returned sales as due', async () => {
    const customer = {
      id: 'customer-id',
      name: 'Customer',
      phone: '01700000000',
      isActive: true,
    } as Customer;
    const customerRepository = {
      findOne: jest.fn().mockResolvedValue(customer),
    } as unknown as Repository<Customer>;
    const salesRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'sale-1',
          invoiceNumber: 'INV-1',
          date: '2026-09-08',
          status: SaleStatus.INCOMPLETE,
          total: '1500.00',
          payments: [{ amount: '1000.00' }],
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              product: { name: 'Phone' },
              quantity: 1,
              unitPrice: '1500.00',
              imeis: ['IMEI-1'],
            },
          ],
        },
        {
          id: 'sale-2',
          invoiceNumber: 'INV-2',
          date: '2026-09-07',
          status: SaleStatus.RETURNED,
          total: '500.00',
          payments: [],
          items: [],
        },
        {
          id: 'sale-3',
          invoiceNumber: 'INV-3',
          date: '2026-09-06',
          status: SaleStatus.IN_PROGRESS,
          total: '700.00',
          payments: [],
          items: [],
        },
      ]),
    };
    const dataSource = {
      getRepository: jest.fn(() => salesRepository),
    } as unknown as DataSource;
    const service = new CustomersService(customerRepository, dataSource);

    const details = await service.getDetails(customer.id);

    expect(details.summary).toEqual({
      totalSales: 1500,
      totalPaid: 1000,
      totalDue: 500,
    });
    expect(details.sales[0].items[0]).toMatchObject({
      productId: 'product-1',
      productName: 'Phone',
      imeis: ['IMEI-1'],
    });
    expect(details.sales[1].remainingDue).toBe(0);
    expect(details.sales).toHaveLength(2);
    expect(details.sales.map((sale) => sale.invoiceNumber)).not.toContain(
      'INV-3',
    );
  });
});

describe('CustomersService safe deletion', () => {
  function setupDeletion(
    customer: Customer | null,
    options: { due?: number; sales?: Array<{ status: SaleStatus }> } = {},
  ) {
    const customerRepository = {
      findOne: jest.fn().mockResolvedValue(customer),
      softRemove: jest.fn().mockResolvedValue(customer),
    };
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(options.sales ?? []),
    };
    const saleRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Customer ? customerRepository : saleRepository,
      ),
      query: jest.fn().mockResolvedValue([{ due: String(options.due ?? 0) }]),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const service = new CustomersService(
      {} as Repository<Customer>,
      dataSource,
    );
    return { service, customerRepository };
  }

  it('soft-deletes a zero-due customer with no active sale', async () => {
    const customer = { id: 'customer-id' } as Customer;
    const context = setupDeletion(customer);

    await expect(context.service.remove(customer.id)).resolves.toEqual({
      message: 'Customer deleted successfully.',
    });
    expect(context.customerRepository.softRemove).toHaveBeenCalledWith(
      customer,
    );
  });

  it('blocks deletion when an outstanding due remains', async () => {
    const context = setupDeletion({ id: 'customer-id' } as Customer, {
      due: 15000,
      sales: [{ status: SaleStatus.INCOMPLETE }],
    });

    await expect(context.service.remove('customer-id')).rejects.toEqual(
      new ConflictException(
        'This customer cannot be deleted because 15000.00 is still due.',
      ),
    );
    expect(context.customerRepository.softRemove).not.toHaveBeenCalled();
  });

  it('blocks deletion for an active sale even when recorded due is zero', async () => {
    const context = setupDeletion({ id: 'customer-id' } as Customer, {
      sales: [{ status: SaleStatus.IN_PROGRESS }],
    });

    await expect(context.service.remove('customer-id')).rejects.toThrow(
      'active incomplete sale',
    );
  });

  it('returns not found for a missing or already deleted customer', async () => {
    const context = setupDeletion(null);

    await expect(context.service.remove('missing')).rejects.toThrow(
      'Customer not found',
    );
  });
});
