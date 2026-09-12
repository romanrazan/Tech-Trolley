import { ConflictException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PurchaseStatus } from '../purchases/entities/purchase.entity';
import { Supplier } from './entities/suppliers.entity';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService lifecycle and details', () => {
  const input = {
    name: 'Supplier',
    phone: '01700000000',
    email: 'supplier@example.com',
    address: 'Dhaka',
  };

  it('creates an inline supplier as pending through the supplied manager', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((values: object) => ({ id: 'supplier-id', ...values })),
      save: jest.fn((values: object) => Promise.resolve(values)),
    };
    const manager = {
      getRepository: jest.fn(() => repository),
    } as unknown as EntityManager;
    const service = new SuppliersService(
      {} as Repository<Supplier>,
      {} as DataSource,
    );

    await expect(
      service.createPendingInTransaction(input, manager),
    ).resolves.toMatchObject({ isActive: false });
  });

  it('rejects duplicate phone or email identifiers', async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({ id: 'existing-supplier' }),
    } as unknown as Repository<Supplier>;
    const service = new SuppliersService(repository, {} as DataSource);

    await expect(service.create(input)).rejects.toEqual(
      new ConflictException(
        'A supplier with this phone or email already exists, including archived records.',
      ),
    );
  });

  it('uses one aggregate query that hides pending suppliers and excludes unpaid purchases', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: 'active-supplier',
        ...input,
        isActive: true,
        totalPurchases: '100.00',
        totalPaid: '60.00',
        due: '40.00',
      },
    ]);
    const service = new SuppliersService(
      {} as Repository<Supplier>,
      { query } as unknown as DataSource,
    );

    await expect(service.findAll()).resolves.toMatchObject([
      { id: 'active-supplier', totalPurchases: 100, totalPaid: 60, due: 40 },
    ]);
    const calls = query.mock.calls as unknown as Array<[string]>;
    const sql = calls[0][0];
    expect(sql).toContain('supplier."isActive" = true');
    expect(sql).toContain("status IN ('INCOMPLETE', 'COMPLETED')");
  });

  it('returns product/payment history and excludes IN_PROGRESS purchases', async () => {
    const supplier = {
      id: 'supplier-id',
      ...input,
      isActive: true,
    } as Supplier;
    const repository = {
      findOne: jest.fn().mockResolvedValue(supplier),
    } as unknown as Repository<Supplier>;
    const purchaseRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'purchase-1',
          date: '2026-09-10',
          invoiceNumber: 'PUR-1',
          status: PurchaseStatus.INCOMPLETE,
          total: '100.00',
          remarks: 'Stock',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              product: { name: 'Phone' },
              quantity: 2,
              unitPrice: '50.00',
              imeis: ['IMEI-1', 'IMEI-2'],
            },
          ],
          payments: [
            {
              id: 'payment-1',
              amount: '60.00',
              paymentMethod: 'Cash',
              transactionId: 'TX-1',
              date: '2026-09-10',
            },
          ],
        },
        {
          id: 'purchase-2',
          date: '2026-09-09',
          invoiceNumber: 'PUR-2',
          status: PurchaseStatus.IN_PROGRESS,
          total: '200.00',
          items: [],
          payments: [],
        },
      ]),
    };
    const service = new SuppliersService(repository, {
      getRepository: jest.fn(() => purchaseRepository),
    } as unknown as DataSource);

    const details = await service.getDetails(supplier.id);

    expect(details.summary).toEqual({
      totalPurchases: 100,
      totalPaid: 60,
      totalDue: 40,
    });
    expect(details.purchases).toHaveLength(1);
    expect(details.purchases[0]).toMatchObject({
      invoiceNumber: 'PUR-1',
      paidAmount: 60,
      remainingDue: 40,
      items: [{ productName: 'Phone', quantity: 2 }],
      payments: [{ paymentMethod: 'Cash', date: '2026-09-10' }],
    });
  });
});

describe('SuppliersService safe deletion', () => {
  function setupDeletion(
    supplier: Supplier | null,
    options: {
      due?: number;
      purchases?: Array<{ status: PurchaseStatus }>;
    } = {},
  ) {
    const supplierRepository = {
      findOne: jest.fn().mockResolvedValue(supplier),
      softRemove: jest.fn().mockResolvedValue(supplier),
    };
    const queryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(options.purchases ?? []),
    };
    const purchaseRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Supplier ? supplierRepository : purchaseRepository,
      ),
      query: jest.fn().mockResolvedValue([{ due: String(options.due ?? 0) }]),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const service = new SuppliersService(
      {} as Repository<Supplier>,
      dataSource,
    );
    return { service, supplierRepository };
  }

  it('soft-deletes a zero-due supplier with no active purchase', async () => {
    const supplier = { id: 'supplier-id' } as Supplier;
    const context = setupDeletion(supplier);

    await expect(context.service.remove(supplier.id)).resolves.toEqual({
      message: 'Supplier deleted successfully.',
    });
    expect(context.supplierRepository.softRemove).toHaveBeenCalledWith(
      supplier,
    );
  });

  it('blocks deletion when an outstanding due remains', async () => {
    const context = setupDeletion({ id: 'supplier-id' } as Supplier, {
      due: 25000,
      purchases: [{ status: PurchaseStatus.INCOMPLETE }],
    });

    await expect(context.service.remove('supplier-id')).rejects.toEqual(
      new ConflictException(
        'This supplier cannot be deleted because 25000.00 is still due.',
      ),
    );
    expect(context.supplierRepository.softRemove).not.toHaveBeenCalled();
  });

  it('blocks deletion for an active purchase even when recorded due is zero', async () => {
    const context = setupDeletion({ id: 'supplier-id' } as Supplier, {
      purchases: [{ status: PurchaseStatus.IN_PROGRESS }],
    });

    await expect(context.service.remove('supplier-id')).rejects.toThrow(
      'active incomplete purchase',
    );
  });

  it('returns not found for a missing or already deleted supplier', async () => {
    const context = setupDeletion(null);

    await expect(context.service.remove('missing')).rejects.toThrow(
      'Supplier not found',
    );
  });
});
