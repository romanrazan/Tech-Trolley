import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import {
  InventoryStatus,
  InventoryUnit,
} from '../inventory/entities/inventory-units.entity';
import { PurchaseItem } from '../purchases/entities/purchase-item.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { TrackingType } from './dtos/create-product.dto';
import { Product } from './entities/products.entity';
import { ProductsService } from './products.service';
import { Brand } from '../brands/entities/brands.entity';
import { Category } from '../categories/entities/categories.entity';

describe('ProductsService opening quantity', () => {
  function setup() {
    const manager = {
      create: jest.fn((_entity: unknown, input: object) => ({ ...input })),
      save: jest.fn((_entity: unknown, input: object) =>
        Promise.resolve({ id: 'product-id', ...input }),
      ),
    } as unknown as EntityManager;
    const transaction = jest.fn((work: (manager: EntityManager) => unknown) =>
      work(manager),
    );
    const dataSource = { transaction } as unknown as DataSource;
    const receiveStock = jest.fn().mockResolvedValue([]);
    const inventoryService = { receiveStock } as unknown as InventoryService;
    const service = new ProductsService(
      {} as Repository<Product>,
      inventoryService,
      dataSource,
    );
    const base = {
      name: 'USB Cable',
      brandId: '11111111-1111-4111-8111-111111111111',
      categoryId: '22222222-2222-4222-8222-222222222222',
      trackingType: TrackingType.QUANTITY,
      isActive: true,
    };

    return { service, base, manager, transaction, receiveStock };
  }

  it('creates a quantity-tracked product with zero opening quantity', async () => {
    const { service, base, receiveStock } = setup();

    await expect(
      service.create({ ...base, quantity: 0 }),
    ).resolves.toMatchObject({ id: 'product-id', quantity: 0 });
    expect(receiveStock).not.toHaveBeenCalled();
  });

  it('creates positive opening stock in the same transaction', async () => {
    const { service, base, manager, receiveStock } = setup();

    await expect(
      service.create({ ...base, quantity: 7 }),
    ).resolves.toMatchObject({ id: 'product-id', quantity: 7 });
    expect(receiveStock).toHaveBeenCalledWith(
      null,
      [{ productId: 'product-id', quantity: 7 }],
      manager,
    );
  });

  it.each([
    [-1, 'cannot be negative'],
    [1.5, 'must be an integer'],
    [Number.NaN, 'must be an integer'],
  ])('rejects invalid opening quantity %p', async (quantity, message) => {
    const { service, base, transaction } = setup();

    await expect(service.create({ ...base, quantity })).rejects.toThrow(
      message,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects phantom serialized opening stock', async () => {
    const { service, base, transaction } = setup();

    await expect(
      service.create({
        ...base,
        trackingType: TrackingType.SERIALIZED,
        quantity: 1,
      }),
    ).rejects.toThrow('add stock through Purchase with IMEIs');
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('ProductsService purchase creation', () => {
  function setupPurchaseProduct(
    options: {
      brandActive?: boolean;
      categoryActive?: boolean;
      duplicate?: Product | null;
    } = {},
  ) {
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(options.duplicate ?? null),
      create: jest.fn((input: object) => ({ ...input })),
      save: jest.fn((input: object) =>
        Promise.resolve({ id: 'new-product-id', ...input }),
      ),
    };
    const brandRepository = {
      findOne: jest
        .fn()
        .mockResolvedValue(
          options.brandActive === false
            ? null
            : { id: 'brand-id', isActive: true },
        ),
    };
    const categoryRepository = {
      findOne: jest
        .fn()
        .mockResolvedValue(
          options.categoryActive === false
            ? null
            : { id: 'category-id', isActive: true },
        ),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Brand) return brandRepository;
        if (entity === Category) return categoryRepository;
        return productRepository;
      }),
    } as unknown as EntityManager;
    const service = new ProductsService(
      {} as Repository<Product>,
      {} as InventoryService,
      {} as DataSource,
    );
    const input = {
      name: '  Purchase Product  ',
      brandId: 'brand-id',
      categoryId: 'category-id',
      trackingType: TrackingType.QUANTITY,
      isActive: true,
    };
    return { service, manager, input, productRepository };
  }

  it('creates a validated Product with quantity zero using the supplied manager', async () => {
    const context = setupPurchaseProduct();

    await expect(
      context.service.createForPurchaseInTransaction(
        context.input,
        context.manager,
      ),
    ).resolves.toMatchObject({
      id: 'new-product-id',
      name: 'Purchase Product',
      quantity: 0,
    });
    expect(context.productRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects an inactive Brand or Category', async () => {
    const context = setupPurchaseProduct({ brandActive: false });
    await expect(
      context.service.createForPurchaseInTransaction(
        context.input,
        context.manager,
      ),
    ).rejects.toEqual(new BadRequestException('Select an active Brand'));
  });

  it('rejects a duplicate Product name including archived Products', async () => {
    const context = setupPurchaseProduct({
      duplicate: { id: 'duplicate-id' } as Product,
    });
    await expect(
      context.service.createForPurchaseInTransaction(
        context.input,
        context.manager,
      ),
    ).rejects.toThrow('already exists');
  });
});

describe('ProductsService safe deletion', () => {
  function setupDeletion(
    product: Product | null,
    options: {
      inventory?: InventoryUnit | null;
      activeSale?: SaleItem | null;
      activePurchase?: PurchaseItem | null;
    } = {},
  ) {
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      softRemove: jest.fn().mockResolvedValue(product),
    };
    const inventoryRepository = {
      findOne: jest.fn().mockResolvedValue(options.inventory ?? null),
    };
    const saleItemsRepository = {
      findOne: jest.fn().mockResolvedValue(options.activeSale ?? null),
    };
    const purchaseItemsRepository = {
      findOne: jest.fn().mockResolvedValue(options.activePurchase ?? null),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Product) return productRepository;
        if (entity === InventoryUnit) return inventoryRepository;
        if (entity === SaleItem) return saleItemsRepository;
        return purchaseItemsRepository;
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const service = new ProductsService(
      {} as Repository<Product>,
      {} as InventoryService,
      dataSource,
    );
    return { service, productRepository };
  }

  it('soft-deletes a zero-stock product and preserves related rows', async () => {
    const product = {
      id: 'product-id',
      quantity: 0,
      trackingType: TrackingType.QUANTITY,
    } as Product;
    const context = setupDeletion(product);

    await expect(context.service.remove(product.id)).resolves.toEqual({
      message: 'Product deleted successfully.',
    });
    expect(context.productRepository.softRemove).toHaveBeenCalledWith(product);
  });

  it('blocks deletion while quantity remains in stock', async () => {
    const context = setupDeletion({
      id: 'product-id',
      quantity: 5,
    } as Product);

    await expect(context.service.remove('product-id')).rejects.toEqual(
      new ConflictException(
        'This product cannot be deleted because 5 units are still in stock.',
      ),
    );
    expect(context.productRepository.softRemove).not.toHaveBeenCalled();
  });

  it('blocks deletion for an in-stock serialized IMEI', async () => {
    const context = setupDeletion(
      { id: 'product-id', quantity: 0 } as Product,
      {
        inventory: {
          id: 'inventory-id',
          imei: 'IMEI-1',
          status: InventoryStatus.IN_STOCK,
        } as InventoryUnit,
      },
    );

    await expect(context.service.remove('product-id')).rejects.toThrow(
      'active serialized IMEIs',
    );
    expect(context.productRepository.softRemove).not.toHaveBeenCalled();
  });

  it('blocks deletion while an active transaction references the product', async () => {
    const context = setupDeletion(
      { id: 'product-id', quantity: 0 } as Product,
      { activeSale: { id: 'sale-item-id' } as SaleItem },
    );

    await expect(context.service.remove('product-id')).rejects.toThrow(
      'connected to an active transaction',
    );
  });

  it('returns not found for a missing or already deleted product', async () => {
    const context = setupDeletion(null);

    await expect(context.service.remove('missing')).rejects.toEqual(
      new NotFoundException('Product not found'),
    );
  });
});
