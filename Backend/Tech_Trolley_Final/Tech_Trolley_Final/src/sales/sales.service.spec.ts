import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/entities/customers.entity';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../products/entities/products.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SalesService } from './sales.service';
import { UserRole } from '../auth/user-role.enum';

describe('SalesService transactional stock and customer creation', () => {
  function setup(
    options: {
      prepareError?: Error;
      issueError?: Error;
      existingCustomer?: object;
    } = {},
  ) {
    const save = jest.fn((input: object) =>
      Promise.resolve({ id: 'sale-id', ...input }),
    );
    const findOne = jest.fn().mockResolvedValue(options.existingCustomer);
    const manager = {
      create: jest.fn((_entity: unknown, input: object) => ({ ...input })),
      save,
      findOne,
    };
    const commitTransaction = jest.fn();
    const rollbackTransaction = jest.fn();
    const release = jest.fn();
    const queryRunner = {
      manager: manager as unknown as EntityManager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction,
      rollbackTransaction,
      release,
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const preparedProducts = new Map<string, Product>();
    const prepareSaleStock = options.prepareError
      ? jest.fn().mockRejectedValue(options.prepareError)
      : jest.fn().mockResolvedValue(preparedProducts);
    const issueStock = options.issueError
      ? jest.fn().mockRejectedValue(options.issueError)
      : jest.fn().mockResolvedValue(undefined);
    const inventory = {
      prepareSaleStock,
      issueStock,
    } as unknown as InventoryService;
    const createPendingInTransaction = jest.fn().mockResolvedValue({
      id: 'customer-id',
      name: 'New Customer',
      phone: '01700000000',
      isActive: false,
    });
    const customers = {
      createPendingInTransaction,
    } as unknown as CustomersService;
    const service = new SalesService(
      {} as Repository<Sale>,
      {} as Repository<SaleItem>,
      {} as Repository<SalePayment>,
      inventory,
      {} as AccountsService,
      customers,
      dataSource,
    );

    return {
      service,
      queryRunner,
      createPendingInTransaction,
      prepareSaleStock,
      preparedProducts,
      issueStock,
      commitTransaction,
      rollbackTransaction,
      release,
      findOne,
    };
  }

  const input = {
    invoiceNumber: 'INV-TEST-1',
    newCustomer: { name: 'New Customer', phone: '01700000000' },
    date: '2026-09-08',
    discount: 0,
    vat: 0,
    items: [
      {
        productId: '22222222-2222-4222-8222-222222222222',
        quantity: 1,
        unitPrice: 1000,
        imeis: ['IMEI-1'],
      },
    ],
  };

  it('locks stock, creates the customer, and issues through one manager', async () => {
    const {
      service,
      queryRunner,
      createPendingInTransaction,
      prepareSaleStock,
      preparedProducts,
      issueStock,
      commitTransaction,
      rollbackTransaction,
    } = setup();

    await expect(
      service.create(input, 'salesperson-id'),
    ).resolves.toMatchObject({
      id: 'sale-id',
      customerId: 'customer-id',
      status: SaleStatus.IN_PROGRESS,
    });

    expect(prepareSaleStock).toHaveBeenCalledWith(
      input.items,
      queryRunner.manager,
    );
    expect(createPendingInTransaction).toHaveBeenCalledWith(
      input.newCustomer,
      queryRunner.manager,
    );
    expect(issueStock).toHaveBeenCalledWith(
      'sale-id',
      input.items,
      queryRunner.manager,
      preparedProducts,
    );
    expect(commitTransaction).toHaveBeenCalledTimes(1);
    expect(rollbackTransaction).not.toHaveBeenCalled();
  });

  it('does not create an inline customer when stock validation fails', async () => {
    const {
      service,
      createPendingInTransaction,
      issueStock,
      commitTransaction,
      rollbackTransaction,
      release,
    } = setup({
      prepareError: new BadRequestException('Product is out of stock.'),
    });

    await expect(service.create(input, 'salesperson-id')).rejects.toThrow(
      'Product is out of stock',
    );

    expect(createPendingInTransaction).not.toHaveBeenCalled();
    expect(issueStock).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(commitTransaction).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back the inline customer and sale when inventory issuing fails', async () => {
    const {
      service,
      createPendingInTransaction,
      commitTransaction,
      rollbackTransaction,
    } = setup({ issueError: new BadRequestException('IMEI is unavailable') });

    await expect(service.create(input, 'salesperson-id')).rejects.toThrow(
      'IMEI is unavailable',
    );

    expect(createPendingInTransaction).toHaveBeenCalledTimes(1);
    expect(rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(commitTransaction).not.toHaveBeenCalled();
  });

  it('keeps the existing-customer path mutually exclusive', async () => {
    const existingCustomer = { id: 'existing-customer-id', isActive: true };
    const { service, createPendingInTransaction, findOne } = setup({
      existingCustomer,
    });

    await expect(
      service.create(
        {
          ...input,
          customerId: existingCustomer.id,
          newCustomer: undefined,
        },
        'salesperson-id',
      ),
    ).resolves.toMatchObject({ customerId: existingCustomer.id });

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(createPendingInTransaction).not.toHaveBeenCalled();
  });

  it('rolls back when both customer options reach the service', async () => {
    const { service, createPendingInTransaction, rollbackTransaction } =
      setup();

    await expect(
      service.create(
        { ...input, customerId: 'existing-customer-id' },
        'salesperson-id',
      ),
    ).rejects.toThrow('Provide either customerId or newCustomer, but not both');

    expect(createPendingInTransaction).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('SalesService list ordering and payment summaries', () => {
  function setupList(sales: Sale[]) {
    const queryBuilder: Record<string, jest.Mock> = {};
    queryBuilder.withDeleted = jest.fn(() => queryBuilder);
    queryBuilder.leftJoinAndSelect = jest.fn(() => queryBuilder);
    queryBuilder.orderBy = jest.fn(() => queryBuilder);
    queryBuilder.addOrderBy = jest.fn(() => queryBuilder);
    queryBuilder.setParameters = jest.fn(() => queryBuilder);
    queryBuilder.getMany = jest.fn().mockResolvedValue(sales);
    const salesRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    } as unknown as Repository<Sale>;
    const service = new SalesService(
      salesRepository,
      {} as Repository<SaleItem>,
      {} as Repository<SalePayment>,
      {} as InventoryService,
      {} as AccountsService,
      {} as CustomersService,
      {} as DataSource,
    );
    return { service, queryBuilder };
  }

  it('orders statuses IN_PROGRESS, INCOMPLETE, COMPLETED, terminal, then unknown', async () => {
    const sales = [
      {
        id: 'sale-id',
        total: 100,
        payments: [],
      } as unknown as Sale,
    ];
    const context = setupList(sales);

    await context.service.findAll();

    const orderCalls = context.queryBuilder.orderBy.mock
      .calls as unknown as unknown[][];
    const orderExpression = orderCalls[0]?.[0];
    expect(typeof orderExpression).toBe('string');
    if (typeof orderExpression !== 'string') return;
    expect(orderExpression.indexOf('WHEN :inProgress THEN 0')).toBeLessThan(
      orderExpression.indexOf('WHEN :incomplete THEN 1'),
    );
    expect(orderExpression.indexOf('WHEN :incomplete THEN 1')).toBeLessThan(
      orderExpression.indexOf('WHEN :completed THEN 2'),
    );
    expect(orderExpression.indexOf('WHEN :completed THEN 2')).toBeLessThan(
      orderExpression.indexOf('WHEN :returned THEN 3'),
    );
    expect(orderExpression).toContain('ELSE 4');
  });

  it('orders newest sales first within a status with deterministic fallbacks', async () => {
    const context = setupList([]);

    await context.service.findAll();

    expect(context.queryBuilder.addOrderBy.mock.calls).toEqual([
      ['sale.createdAt', 'DESC'],
      ['sale.date', 'DESC'],
      ['sale.invoiceNumber', 'DESC'],
      ['sale.id', 'DESC'],
    ]);
  });

  it('returns the persisted current outstanding amount after earlier payments', async () => {
    const context = setupList([
      {
        id: 'sale-id',
        total: 100,
        payments: [{ amount: 60 } as SalePayment],
      } as Sale,
    ]);

    await expect(context.service.findAll()).resolves.toEqual([
      expect.objectContaining({ totalPaid: 60, currentDue: 40 }),
    ]);
  });
});

describe('SalesService payment status transitions', () => {
  const ownerActor = { id: 'owner-id', role: UserRole.OWNER };
  const managerActor = { id: 'manager-id', role: UserRole.MANAGER };
  const salespersonActor = {
    id: 'salesperson-id',
    role: UserRole.SALESPERSON,
  };
  const paymentDto = {
    amount: 60,
    paymentMethod: 'Cash',
    accountId: '33333333-3333-4333-8333-333333333333',
    date: '2026-09-10',
  };

  function setupPayment(
    options: {
      status?: SaleStatus;
      total?: number;
      previousPaid?: number;
      customerActive?: boolean;
      accountError?: Error;
      transactionExists?: boolean;
      salespersonId?: string;
      saleMissing?: boolean;
    } = {},
  ) {
    const sale = {
      id: 'sale-id',
      customerId: 'customer-id',
      salespersonId: options.salespersonId ?? 'salesperson-id',
      status: options.status ?? SaleStatus.IN_PROGRESS,
      total: options.total ?? 100,
    } as Sale;
    const customer = {
      id: 'customer-id',
      isActive: options.customerActive ?? false,
    } as Customer;
    const paymentRepository = {
      sum: jest.fn().mockResolvedValue(options.previousPaid ?? 0),
      exists: jest.fn().mockResolvedValue(options.transactionExists ?? false),
    };
    const save = jest.fn((first: unknown, second?: unknown) =>
      Promise.resolve(second ?? first),
    );
    const manager = {
      findOne: jest.fn((entity: unknown) =>
        Promise.resolve(
          entity === Sale ? (options.saleMissing ? null : sale) : customer,
        ),
      ),
      getRepository: jest.fn(() => paymentRepository),
      create: jest.fn((_entity: unknown, input: object) => ({
        id: 'payment-id',
        ...input,
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
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const recordInflow = options.accountError
      ? jest.fn().mockRejectedValue(options.accountError)
      : jest.fn().mockResolvedValue(undefined);
    const accounts = { recordInflow } as unknown as AccountsService;
    const service = new SalesService(
      {} as Repository<Sale>,
      {} as Repository<SaleItem>,
      {} as Repository<SalePayment>,
      {} as InventoryService,
      accounts,
      {} as CustomersService,
      dataSource,
    );

    return {
      service,
      sale,
      customer,
      save,
      recordInflow,
      commitTransaction,
      rollbackTransaction,
    };
  }

  it('changes a first partial payment to INCOMPLETE and activates the customer', async () => {
    const context = setupPayment();

    await expect(
      context.service.addPayment('sale-id', paymentDto, ownerActor),
    ).resolves.toMatchObject({
      amount: 60,
      saleId: 'sale-id',
    });

    expect(context.sale.status).toBe(SaleStatus.INCOMPLETE);
    expect(context.customer.isActive).toBe(true);
    expect(context.recordInflow).toHaveBeenCalledTimes(1);
    expect(context.recordInflow).toHaveBeenCalledWith(
      expect.anything(),
      paymentDto.accountId,
      60,
      'Cash',
    );
    expect(context.save).toHaveBeenCalledWith(Sale, context.sale);
    expect(context.save).toHaveBeenCalledWith(Customer, context.customer);
    expect(context.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('changes a first full payment to COMPLETED and activates the customer', async () => {
    const context = setupPayment();

    await context.service.addPayment(
      'sale-id',
      {
        ...paymentDto,
        amount: 100,
      },
      ownerActor,
    );

    expect(context.sale.status).toBe(SaleStatus.COMPLETED);
    expect(context.customer.isActive).toBe(true);
  });

  it('keeps an additional partial payment INCOMPLETE', async () => {
    const context = setupPayment({
      status: SaleStatus.INCOMPLETE,
      previousPaid: 60,
      customerActive: true,
    });

    await context.service.addPayment(
      'sale-id',
      {
        ...paymentDto,
        amount: 20,
      },
      ownerActor,
    );

    expect(context.sale.status).toBe(SaleStatus.INCOMPLETE);
    expect(context.customer.isActive).toBe(true);
  });

  it('changes INCOMPLETE to COMPLETED on the final payment', async () => {
    const context = setupPayment({
      status: SaleStatus.INCOMPLETE,
      previousPaid: 60,
      customerActive: true,
    });

    await context.service.addPayment(
      'sale-id',
      {
        ...paymentDto,
        amount: 40,
      },
      ownerActor,
    );

    expect(context.sale.status).toBe(SaleStatus.COMPLETED);
  });

  it('rolls back without activating the customer or changing status when account credit fails', async () => {
    const context = setupPayment({ accountError: new Error('Account failed') });

    await expect(
      context.service.addPayment('sale-id', paymentDto, ownerActor),
    ).rejects.toThrow('Account failed');

    expect(context.sale.status).toBe(SaleStatus.IN_PROGRESS);
    expect(context.customer.isActive).toBe(false);
    expect(context.save).not.toHaveBeenCalledWith(Sale, context.sale);
    expect(context.save).not.toHaveBeenCalledWith(Customer, context.customer);
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(context.commitTransaction).not.toHaveBeenCalled();
  });

  it('rejects a payment for a COMPLETED sale', async () => {
    const context = setupPayment({
      status: SaleStatus.COMPLETED,
      previousPaid: 100,
      customerActive: true,
    });

    await expect(
      context.service.addPayment('sale-id', paymentDto, ownerActor),
    ).rejects.toThrow('Completed sale has no outstanding due');

    expect(context.recordInflow).not.toHaveBeenCalled();
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an overpayment without recording an account inflow', async () => {
    const context = setupPayment({
      status: SaleStatus.INCOMPLETE,
      previousPaid: 60,
      customerActive: true,
    });

    await expect(
      context.service.addPayment(
        'sale-id',
        {
          ...paymentDto,
          amount: 50,
        },
        ownerActor,
      ),
    ).rejects.toThrow('Payment exceeds the outstanding due of 40');

    expect(context.recordInflow).not.toHaveBeenCalled();
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects payment when persisted payments already cover the total', async () => {
    const context = setupPayment({
      status: SaleStatus.INCOMPLETE,
      previousPaid: 100,
      customerActive: true,
    });

    await expect(
      context.service.addPayment('sale-id', paymentDto, ownerActor),
    ).rejects.toThrow('Completed sale has no outstanding due');
    expect(context.recordInflow).not.toHaveBeenCalled();
  });

  it('rejects duplicate customer transaction references before account credit', async () => {
    const context = setupPayment({ transactionExists: true });

    await expect(
      context.service.addPayment(
        'sale-id',
        {
          ...paymentDto,
          transactionId: 'CUSTOMER-PAYMENT-1',
        },
        ownerActor,
      ),
    ).rejects.toThrow('already been recorded');
    expect(context.recordInflow).not.toHaveBeenCalled();
  });

  it('rejects unsupported payment methods before account credit', async () => {
    const context = setupPayment();

    await expect(
      context.service.addPayment(
        'sale-id',
        {
          ...paymentDto,
          paymentMethod: 'Cheque',
        },
        ownerActor,
      ),
    ).rejects.toThrow('Unsupported payment method');
    expect(context.recordInflow).not.toHaveBeenCalled();
  });

  it('allows a salesperson to record payment for their own sale', async () => {
    const context = setupPayment();

    await expect(
      context.service.addPayment('sale-id', paymentDto, salespersonActor),
    ).resolves.toMatchObject({ id: 'payment-id' });
    expect(context.recordInflow).toHaveBeenCalledTimes(1);
  });

  it('forbids a salesperson from paying another salesperson sale before mutations', async () => {
    const context = setupPayment({ salespersonId: 'another-salesperson-id' });

    await expect(
      context.service.addPayment('sale-id', paymentDto, salespersonActor),
    ).rejects.toEqual(
      new ForbiddenException(
        'Salespeople can only record payments for their own sales',
      ),
    );
    expect(context.recordInflow).not.toHaveBeenCalled();
    expect(context.save).not.toHaveBeenCalled();
    expect(context.rollbackTransaction).toHaveBeenCalledTimes(1);
  });

  it('returns not found before evaluating ownership when the sale is missing', async () => {
    const context = setupPayment({ saleMissing: true });

    await expect(
      context.service.addPayment('missing-sale', paymentDto, salespersonActor),
    ).rejects.toEqual(new NotFoundException('Sale not found'));
    expect(context.recordInflow).not.toHaveBeenCalled();
    expect(context.save).not.toHaveBeenCalled();
  });

  it.each([
    ['owner', ownerActor],
    ['manager', managerActor],
  ])('allows an %s to pay any eligible sale', async (_label, actor) => {
    const context = setupPayment({ salespersonId: 'another-salesperson-id' });

    await expect(
      context.service.addPayment('sale-id', paymentDto, actor),
    ).resolves.toMatchObject({ id: 'payment-id' });
  });
});

describe('SalesService historical master records', () => {
  it('loads archived customer, product, and account relations for sale details', async () => {
    const sale = {
      id: 'sale-id',
      customer: { id: 'customer-id', name: 'Archived Customer' },
      total: 100,
    } as Sale;
    const item = {
      id: 'item-id',
      product: { id: 'product-id', name: 'Archived Product' },
    } as SaleItem;
    const payment = {
      id: 'payment-id',
      amount: 100,
      account: { id: 'account-id', name: 'Archived Account' },
    } as SalePayment;
    const findSale = jest.fn().mockResolvedValue(sale);
    const findItems = jest.fn().mockResolvedValue([item]);
    const findPayments = jest.fn().mockResolvedValue([payment]);
    const salesRepository = {
      findOne: findSale,
    } as unknown as Repository<Sale>;
    const itemsRepository = {
      find: findItems,
    } as unknown as Repository<SaleItem>;
    const paymentsRepository = {
      find: findPayments,
    } as unknown as Repository<SalePayment>;
    const service = new SalesService(
      salesRepository,
      itemsRepository,
      paymentsRepository,
      {} as InventoryService,
      {} as AccountsService,
      {} as CustomersService,
      {} as DataSource,
    );

    const details = await service.findOne(sale.id);

    expect(details.sale.customer?.name).toBe('Archived Customer');
    expect(details.items[0].product?.name).toBe('Archived Product');
    expect(details.payments[0].account?.name).toBe('Archived Account');
    expect(findSale).toHaveBeenCalledWith(
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
