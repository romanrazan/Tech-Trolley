import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../products/entities/products.entity';
import { ProductsService } from '../products/products.service';
import { TrackingType } from '../products/dtos/create-product.dto';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchasesService } from './purchases.service';

describe('PurchasesService creation transaction', () => {
  const input = {
    invoiceNumber: 'PUR-TEST-1',
    supplierId: '11111111-1111-4111-8111-111111111111',
    date: '2026-09-10',
    remarks: 'Test purchase',
    items: [
      {
        productId: '22222222-2222-4222-8222-222222222222',
        quantity: 2,
        unitPrice: 50,
      },
    ],
  };

  function setup(options: { inventoryError?: Error } = {}) {
    const supplier = { id: input.supplierId, isActive: true } as Supplier;
    const existingProduct = {
      id: input.items[0].productId,
      name: 'Existing Product',
      isActive: true,
    } as Product;
    const productQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([existingProduct]),
    };
    const save = jest.fn((_entity: unknown) => Promise.resolve(_entity));
    const manager = {
      findOne: jest.fn().mockResolvedValue(supplier),
      create: jest.fn((entity: unknown, values: object) => ({
        id: entity === Purchase ? 'purchase-id' : 'item-id',
        ...values,
      })),
      save,
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Product) {
          return { createQueryBuilder: jest.fn(() => productQuery) };
        }
        return {};
      }),
    };
    const commitTransaction = jest.fn();
    const rollbackTransaction = jest.fn();
    const queryRunner = {
      manager: manager as unknown as EntityManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction,
      rollbackTransaction,
      release: jest.fn(),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const receiveStock = options.inventoryError
      ? jest.fn().mockRejectedValue(options.inventoryError)
      : jest.fn().mockResolvedValue([]);
    const createPendingInTransaction = jest.fn().mockResolvedValue({
      id: 'pending-supplier-id',
      isActive: false,
    });
    const recordOutflow = jest.fn();
    const createForPurchaseInTransaction = jest
      .fn()
      .mockResolvedValue({ id: 'new-product-id', quantity: 0 });
    const service = new PurchasesService(
      {} as Repository<Purchase>,
      {} as Repository<PurchaseItem>,
      {} as Repository<PurchasePayment>,
      { receiveStock } as unknown as InventoryService,
      { recordOutflow } as unknown as AccountsService,
      { createPendingInTransaction } as unknown as SuppliersService,
      { createForPurchaseInTransaction } as unknown as ProductsService,
      dataSource,
    );
    return {
      service,
      queryRunner,
      receiveStock,
      recordOutflow,
      createPendingInTransaction,
      createForPurchaseInTransaction,
      productQuery,
      commitTransaction,
      rollbackTransaction,
    };
  }

  it('uses an existing active supplier and creates IN_PROGRESS', async () => {
    const context = setup();

    await expect(context.service.create(input)).resolves.toMatchObject({
      id: 'purchase-id',
      supplierId: input.supplierId,
      status: PurchaseStatus.IN_PROGRESS,
      total: 100,
    });

    expect(context.createPendingInTransaction).not.toHaveBeenCalled();
    expect(context.productQuery.andWhere).toHaveBeenCalledWith(
      'product."deletedAt" IS NULL',
    );
    expect(context.receiveStock).toHaveBeenCalledTimes(1);
    expect(context.recordOutflow).not.toHaveBeenCalled();
    expect(context.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('creates a pending inline supplier inside the purchase transaction', async () => {
    const context = setup();
    const newSupplier = {
      name: 'Inline Supplier',
      phone: '01700000001',
      email: 'inline@example.com',
      address: 'Dhaka',
    };

    await expect(
      context.service.create({
        ...input,
        supplierId: undefined,
        newSupplier,
      }),
    ).resolves.toMatchObject({ supplierId: 'pending-supplier-id' });

    expect(context.createPendingInTransaction).toHaveBeenCalledWith(
      newSupplier,
      context.queryRunner.manager,
    );
  });

  it('rejects both supplier choices and rolls back', async () => {
    const context = setup();

    await expect(
      context.service.create({
        ...input,
        newSupplier: {
          name: 'Inline Supplier',
          phone: '01700000001',
          email: 'inline@example.com',
          address: 'Dhaka',
        },
      }),
    ).rejects.toThrow('Provide either supplierId or newSupplier, but not both');

    expect(context.receiveStock).not.toHaveBeenCalled();
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('rolls back the purchase, items, and pending supplier if inventory receiving fails', async () => {
    const context = setup({
      inventoryError: new BadRequestException('Duplicate IMEI'),
    });

    await expect(
      context.service.create({
        ...input,
        supplierId: undefined,
        newSupplier: {
          name: 'Inline Supplier',
          phone: '01700000001',
          email: 'inline@example.com',
          address: 'Dhaka',
        },
      }),
    ).rejects.toThrow('Duplicate IMEI');

    expect(context.receiveStock).toHaveBeenCalledTimes(1);
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(context.commitTransaction).not.toHaveBeenCalled();
  });

  it('creates a new Product at zero quantity in the same transaction and receives its stock once', async () => {
    const context = setup();
    const newProduct = {
      name: 'Inline Product',
      brandId: '33333333-3333-4333-8333-333333333333',
      categoryId: '44444444-4444-4444-8444-444444444444',
      trackingType: TrackingType.QUANTITY,
      isActive: true,
    };

    await context.service.create({
      ...input,
      items: [{ newProduct, quantity: 4, unitPrice: 25 }],
    });

    expect(context.createForPurchaseInTransaction).toHaveBeenCalledWith(
      newProduct,
      context.queryRunner.manager,
    );
    expect(context.receiveStock).toHaveBeenCalledTimes(1);
    expect(context.receiveStock).toHaveBeenCalledWith(
      'purchase-id',
      [
        {
          productId: 'new-product-id',
          quantity: 4,
          unitPrice: 25,
        },
      ],
      context.queryRunner.manager,
    );
  });

  it('rolls back an inline Supplier and Product when stock receipt fails', async () => {
    const context = setup({
      inventoryError: new BadRequestException('IMEI already exists'),
    });

    await expect(
      context.service.create({
        ...input,
        supplierId: undefined,
        newSupplier: {
          name: 'Rollback Supplier',
          phone: '01700000002',
          email: 'rollback@example.com',
          address: 'Dhaka',
        },
        items: [
          {
            newProduct: {
              name: 'Rollback Product',
              brandId: '33333333-3333-4333-8333-333333333333',
              categoryId: '44444444-4444-4444-8444-444444444444',
              trackingType: TrackingType.SERIALIZED,
              isActive: true,
            },
            quantity: 1,
            unitPrice: 100,
            imeis: ['DUPLICATE-IMEI'],
          },
        ],
      }),
    ).rejects.toThrow('IMEI already exists');

    expect(context.createPendingInTransaction).toHaveBeenCalledTimes(1);
    expect(context.createForPurchaseInTransaction).toHaveBeenCalledTimes(1);
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(context.commitTransaction).not.toHaveBeenCalled();
  });

  it('supports a mixture of existing and new Products', async () => {
    const context = setup();

    await context.service.create({
      ...input,
      items: [
        input.items[0],
        {
          newProduct: {
            name: 'Inline Product',
            brandId: '33333333-3333-4333-8333-333333333333',
            categoryId: '44444444-4444-4444-8444-444444444444',
            trackingType: TrackingType.SERIALIZED,
            isActive: false,
          },
          quantity: 1,
          unitPrice: 75,
          imeis: [' NEW-IMEI '],
        },
      ],
    });

    expect(context.receiveStock).toHaveBeenCalledWith(
      'purchase-id',
      expect.arrayContaining([
        expect.objectContaining({ productId: input.items[0].productId }),
        expect.objectContaining({
          productId: 'new-product-id',
          imeis: ['NEW-IMEI'],
        }),
      ]),
      context.queryRunner.manager,
    );
  });

  it('rejects non-exclusive Product input and rolls back', async () => {
    const context = setup();

    await expect(
      context.service.create({
        ...input,
        items: [
          {
            ...input.items[0],
            newProduct: {
              name: 'Inline Product',
              brandId: '33333333-3333-4333-8333-333333333333',
              categoryId: '44444444-4444-4444-8444-444444444444',
              trackingType: TrackingType.QUANTITY,
              isActive: true,
            },
          },
        ],
      }),
    ).rejects.toThrow('provide either productId or newProduct, but not both');
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('PurchasesService payment transaction', () => {
  const payment = {
    amount: 60,
    paymentMethod: 'Cash',
    accountId: '33333333-3333-4333-8333-333333333333',
    transactionId: 'PAY-1',
    date: '2026-09-10',
  };

  function setupPayment(
    options: {
      status?: PurchaseStatus;
      previousPaid?: number;
      supplierActive?: boolean;
      outflowError?: Error;
      transactionExists?: boolean;
    } = {},
  ) {
    const purchase = {
      id: 'purchase-id',
      supplierId: 'supplier-id',
      total: 100,
      status: options.status ?? PurchaseStatus.IN_PROGRESS,
    } as Purchase;
    const supplier = {
      id: 'supplier-id',
      isActive: options.supplierActive ?? false,
    } as Supplier;
    const paymentRepository = {
      sum: jest.fn().mockResolvedValue(options.previousPaid ?? 0),
      exists: jest.fn().mockResolvedValue(options.transactionExists ?? false),
    };
    const save = jest.fn((first: unknown, second?: unknown) =>
      Promise.resolve(second ?? first),
    );
    const manager = {
      findOne: jest.fn((entity: unknown) =>
        Promise.resolve(entity === Purchase ? purchase : supplier),
      ),
      getRepository: jest.fn(() => paymentRepository),
      create: jest.fn((_entity: unknown, values: object) => ({
        id: 'payment-id',
        ...values,
      })),
      save,
    };
    const commitTransaction = jest.fn();
    const rollbackTransaction = jest.fn();
    const queryRunner = {
      manager: manager as unknown as EntityManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction,
      rollbackTransaction,
      release: jest.fn(),
    };
    const recordOutflow = options.outflowError
      ? jest.fn().mockRejectedValue(options.outflowError)
      : jest.fn().mockResolvedValue(undefined);
    const service = new PurchasesService(
      {} as Repository<Purchase>,
      {} as Repository<PurchaseItem>,
      {} as Repository<PurchasePayment>,
      {} as InventoryService,
      { recordOutflow } as unknown as AccountsService,
      {} as SuppliersService,
      {} as ProductsService,
      {
        createQueryRunner: jest.fn(() => queryRunner),
      } as unknown as DataSource,
    );
    return {
      service,
      purchase,
      supplier,
      save,
      recordOutflow,
      commitTransaction,
      rollbackTransaction,
    };
  }

  it('changes a first partial payment to INCOMPLETE and activates the supplier', async () => {
    const context = setupPayment();

    await context.service.addPayment('purchase-id', payment);

    expect(context.purchase.status).toBe(PurchaseStatus.INCOMPLETE);
    expect(context.supplier.isActive).toBe(true);
    expect(context.recordOutflow).toHaveBeenCalledTimes(1);
    expect(context.recordOutflow).toHaveBeenCalledWith(
      expect.anything(),
      payment.accountId,
      60,
      'Cash',
    );
    expect(context.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('changes a first full payment to COMPLETED', async () => {
    const context = setupPayment();
    await context.service.addPayment('purchase-id', {
      ...payment,
      amount: 100,
    });
    expect(context.purchase.status).toBe(PurchaseStatus.COMPLETED);
  });

  it('keeps an additional partial payment INCOMPLETE', async () => {
    const context = setupPayment({
      status: PurchaseStatus.INCOMPLETE,
      previousPaid: 60,
      supplierActive: true,
    });
    await context.service.addPayment('purchase-id', {
      ...payment,
      amount: 20,
    });
    expect(context.purchase.status).toBe(PurchaseStatus.INCOMPLETE);
  });

  it('changes INCOMPLETE to COMPLETED on the final payment', async () => {
    const context = setupPayment({
      status: PurchaseStatus.INCOMPLETE,
      previousPaid: 60,
      supplierActive: true,
    });
    await context.service.addPayment('purchase-id', {
      ...payment,
      amount: 40,
    });
    expect(context.purchase.status).toBe(PurchaseStatus.COMPLETED);
  });

  it('rejects overpayment without debiting the account', async () => {
    const context = setupPayment({
      status: PurchaseStatus.INCOMPLETE,
      previousPaid: 60,
      supplierActive: true,
    });
    await expect(
      context.service.addPayment('purchase-id', {
        ...payment,
        amount: 50,
      }),
    ).rejects.toThrow('Payment exceeds the outstanding due');
    expect(context.recordOutflow).not.toHaveBeenCalled();
  });

  it.each([0, -1])('rejects a paid amount of %s', async (amount) => {
    const context = setupPayment();
    await expect(
      context.service.addPayment('purchase-id', { ...payment, amount }),
    ).rejects.toThrow('Paid amount must be greater than zero');
    expect(context.recordOutflow).not.toHaveBeenCalled();
  });

  it.each([PurchaseStatus.COMPLETED, PurchaseStatus.CANCELLED])(
    'rejects payment for %s purchases',
    async (status) => {
      const context = setupPayment({ status, supplierActive: true });
      await expect(
        context.service.addPayment('purchase-id', payment),
      ).rejects.toThrow();
      expect(context.recordOutflow).not.toHaveBeenCalled();
    },
  );

  it('rolls back without activating supplier or changing status when debit fails', async () => {
    const context = setupPayment({
      outflowError: new BadRequestException('Insufficient account balance'),
    });
    await expect(
      context.service.addPayment('purchase-id', payment),
    ).rejects.toThrow('Insufficient account balance');
    expect(context.purchase.status).toBe(PurchaseStatus.IN_PROGRESS);
    expect(context.supplier.isActive).toBe(false);
    expect(context.save).not.toHaveBeenCalledWith(Purchase, context.purchase);
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate transaction id before debit', async () => {
    const context = setupPayment({ transactionExists: true });
    await expect(
      context.service.addPayment('purchase-id', payment),
    ).rejects.toThrow('already been recorded');
    expect(context.recordOutflow).not.toHaveBeenCalled();
  });
});

describe('PurchasesService historical master records', () => {
  it('loads archived supplier, product, and account relations for purchase details', async () => {
    const purchase = {
      id: 'purchase-id',
      supplier: { id: 'supplier-id', name: 'Archived Supplier' },
      total: 100,
    } as Purchase;
    const item = {
      id: 'item-id',
      product: { id: 'product-id', name: 'Archived Product' },
    } as PurchaseItem;
    const payment = {
      id: 'payment-id',
      amount: 100,
      account: { id: 'account-id', name: 'Archived Account' },
    } as PurchasePayment;
    const findPurchase = jest.fn().mockResolvedValue(purchase);
    const findItems = jest.fn().mockResolvedValue([item]);
    const findPayments = jest.fn().mockResolvedValue([payment]);
    const purchasesRepository = {
      findOne: findPurchase,
    } as unknown as Repository<Purchase>;
    const itemsRepository = {
      find: findItems,
    } as unknown as Repository<PurchaseItem>;
    const paymentsRepository = {
      find: findPayments,
    } as unknown as Repository<PurchasePayment>;
    const service = new PurchasesService(
      purchasesRepository,
      itemsRepository,
      paymentsRepository,
      {} as InventoryService,
      {} as AccountsService,
      {} as SuppliersService,
      {} as ProductsService,
      {} as DataSource,
    );

    const details = await service.findOne(purchase.id);

    expect(details.purchase.supplier?.name).toBe('Archived Supplier');
    expect(details.items[0].product?.name).toBe('Archived Product');
    expect(details.payments[0].account?.name).toBe('Archived Account');
    expect(findPurchase).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(findItems).toHaveBeenCalledWith(
      expect.objectContaining({ withDeleted: true }),
    );
    expect(findPayments).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { account: true },
        withDeleted: true,
      }),
    );
  });
});
