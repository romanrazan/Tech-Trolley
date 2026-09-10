import { EntityManager, Repository } from 'typeorm';
import { Product } from '../products/entities/products.entity';
import {
  InventoryStatus,
  InventoryUnit,
} from './entities/inventory-units.entity';
import { InventoryService } from './inventory.service';

describe('InventoryService product quantity', () => {
  const serializedProduct = (quantity = 1): Product =>
    ({
      id: 'product-a',
      name: 'Phone A',
      trackingType: 'SERIALIZED',
      quantity,
      isActive: true,
    }) as Product;

  const quantityProduct = (quantity = 5): Product =>
    ({
      id: 'product-b',
      name: 'Accessory B',
      trackingType: 'QUANTITY',
      quantity,
      isActive: true,
    }) as Product;

  function setup(
    product: Product,
    options: {
      unit?: InventoryUnit;
      availableUnits?: InventoryUnit[];
      existingImeis?: InventoryUnit[];
    } = {},
  ) {
    const inventoryCreate = jest.fn((input: object) => ({ ...input }));
    const inventorySave = jest.fn((input: object) => Promise.resolve(input));
    const getMany = jest.fn().mockResolvedValue(options.availableUnits ?? []);
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getMany,
    };
    const inventoryRepository = {
      find: jest.fn().mockResolvedValue(options.existingImeis ?? []),
      findOne: jest.fn().mockResolvedValue(options.unit),
      create: inventoryCreate,
      save: inventorySave,
      createQueryBuilder: jest.fn(() => queryBuilder),
    } as unknown as Repository<InventoryUnit>;
    const productSave = jest.fn((input: object) => Promise.resolve(input));
    const productRepository = {
      find: jest.fn().mockResolvedValue([product]),
      save: productSave,
    } as unknown as Repository<Product>;

    return {
      service: new InventoryService(inventoryRepository, productRepository),
      inventoryCreate,
      inventorySave,
      productSave,
    };
  }

  it('receives serialized inventory and increments product quantity once', async () => {
    const product = serializedProduct(0);
    const { service, inventoryCreate, productSave } = setup(product);

    await service.receiveStock('purchase-id', [
      {
        productId: product.id,
        quantity: 2,
        imeis: ['IMEI-1', 'IMEI-2'],
      },
    ]);

    expect(inventoryCreate).toHaveBeenCalledTimes(2);
    expect(inventoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ productId: product.id, imei: 'IMEI-1' }),
    );
    expect(product.quantity).toBe(2);
    expect(productSave).toHaveBeenCalledTimes(1);
  });

  it('receives duplicate quantity lines but increments the product exactly once', async () => {
    const product = quantityProduct(4);
    const { service, productSave } = setup(product);

    await service.receiveStock('purchase-id', [
      { productId: product.id, quantity: 2 },
      { productId: product.id, quantity: 3 },
    ]);

    expect(product.quantity).toBe(9);
    expect(productSave).toHaveBeenCalledTimes(1);
    expect(productSave).toHaveBeenCalledWith([product]);
  });

  it('rejects duplicate serialized IMEIs before writing stock', async () => {
    const product = serializedProduct(0);
    const { service, inventorySave, productSave } = setup(product);

    await expect(
      service.receiveStock('purchase-id', [
        {
          productId: product.id,
          quantity: 2,
          imeis: ['IMEI-1', 'IMEI-1'],
        },
      ]),
    ).rejects.toThrow('Duplicate IMEIs');
    expect(inventorySave).not.toHaveBeenCalled();
    expect(productSave).not.toHaveBeenCalled();
    expect(product.quantity).toBe(0);
  });

  it('rejects duplicate serialized IMEIs across separate lines', async () => {
    const product = serializedProduct(0);
    const { service, inventorySave, productSave } = setup(product);

    await expect(
      service.receiveStock('purchase-id', [
        { productId: product.id, quantity: 1, imeis: ['IMEI-CROSS'] },
        { productId: product.id, quantity: 1, imeis: ['IMEI-CROSS'] },
      ]),
    ).rejects.toThrow('Duplicate IMEIs');
    expect(inventorySave).not.toHaveBeenCalled();
    expect(productSave).not.toHaveBeenCalled();
  });

  it('rejects an IMEI that already exists in the database', async () => {
    const product = serializedProduct(0);
    const { service, inventorySave, productSave } = setup(product, {
      existingImeis: [{ imei: 'IMEI-EXISTS' } as InventoryUnit],
    });

    await expect(
      service.receiveStock('purchase-id', [
        { productId: product.id, quantity: 1, imeis: ['IMEI-EXISTS'] },
      ]),
    ).rejects.toThrow('already exists in inventory');
    expect(inventorySave).not.toHaveBeenCalled();
    expect(productSave).not.toHaveBeenCalled();
  });

  it('rejects IMEIs for a quantity-tracked Product', async () => {
    const product = quantityProduct(0);
    const { service, inventorySave, productSave } = setup(product);

    await expect(
      service.receiveStock('purchase-id', [
        { productId: product.id, quantity: 1, imeis: ['NOT-ALLOWED'] },
      ]),
    ).rejects.toThrow('quantity tracked and cannot have IMEIs');
    expect(inventorySave).not.toHaveBeenCalled();
    expect(productSave).not.toHaveBeenCalled();
  });

  it('prevents selling a product with zero quantity', async () => {
    const product = quantityProduct(0);
    const { service, inventorySave, productSave } = setup(product);

    await expect(
      service.issueStock('sale-id', [{ productId: product.id, quantity: 1 }]),
    ).rejects.toThrow('out of stock');
    expect(inventorySave).not.toHaveBeenCalled();
    expect(productSave).not.toHaveBeenCalled();
    expect(product.quantity).toBe(0);
  });

  it('prevents selling more than the available product quantity', async () => {
    const product = quantityProduct(2);
    const { service, productSave } = setup(product);

    await expect(
      service.issueStock('sale-id', [{ productId: product.id, quantity: 3 }]),
    ).rejects.toThrow('Only 2 units of Accessory B are available');
    expect(productSave).not.toHaveBeenCalled();
    expect(product.quantity).toBe(2);
  });

  it('aggregates duplicate product lines during availability validation', async () => {
    const product = quantityProduct(5);
    const { service } = setup(product);

    await expect(
      service.checkAvailability([
        { productId: product.id, quantity: 3 },
        { productId: product.id, quantity: 4 },
      ]),
    ).rejects.toThrow('Only 5 units of Accessory B are available');
  });

  it('sells the exact quantity and leaves both ledger and product at zero', async () => {
    const product = quantityProduct(5);
    const unit = {
      id: 'unit-id',
      productId: product.id,
      quantity: 5,
      purchaseId: 'purchase-id',
      status: InventoryStatus.IN_STOCK,
    } as InventoryUnit;
    const { service, inventorySave, productSave } = setup(product, {
      availableUnits: [unit],
    });

    await service.issueStock('sale-id', [
      { productId: product.id, quantity: 5 },
    ]);

    expect(unit).toMatchObject({
      quantity: 5,
      status: InventoryStatus.SOLD,
      saleId: 'sale-id',
    });
    expect(product.quantity).toBe(0);
    expect(inventorySave).toHaveBeenCalledWith(unit);
    expect(productSave).toHaveBeenCalledTimes(1);
  });

  it('splits quantity inventory and decrements product quantity once', async () => {
    const product = quantityProduct(5);
    const unit = {
      id: 'unit-id',
      productId: product.id,
      quantity: 5,
      purchaseId: 'purchase-id',
      status: InventoryStatus.IN_STOCK,
    } as InventoryUnit;
    const { service, inventoryCreate, inventorySave, productSave } = setup(
      product,
      { availableUnits: [unit] },
    );

    await service.issueStock('sale-id', [
      { productId: product.id, quantity: 3 },
    ]);

    expect(unit).toMatchObject({
      quantity: 2,
      status: InventoryStatus.IN_STOCK,
    });
    expect(inventoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: product.id,
        quantity: 3,
        status: InventoryStatus.SOLD,
      }),
    );
    expect(inventorySave).toHaveBeenCalledTimes(2);
    expect(product.quantity).toBe(2);
    expect(productSave).toHaveBeenCalledTimes(1);
  });

  it('updates serialized IMEI status and product quantity together', async () => {
    const product = serializedProduct(1);
    const unit = {
      id: 'unit-id',
      productId: product.id,
      imei: 'IMEI-1',
      quantity: 1,
      status: InventoryStatus.IN_STOCK,
    } as InventoryUnit;
    const { service, inventorySave, productSave } = setup(product, { unit });

    await service.issueStock('sale-id', [
      { productId: product.id, quantity: 1, imeis: ['IMEI-1'] },
    ]);

    expect(unit).toMatchObject({
      status: InventoryStatus.SOLD,
      saleId: 'sale-id',
    });
    expect(product.quantity).toBe(0);
    expect(inventorySave).toHaveBeenCalledWith(unit);
    expect(productSave).toHaveBeenCalledTimes(1);
  });

  it('does not decrement product quantity when serialized issuing fails', async () => {
    const product = serializedProduct(1);
    const { service, productSave } = setup(product);

    await expect(
      service.issueStock('sale-id', [
        { productId: product.id, quantity: 1, imeis: ['MISSING'] },
      ]),
    ).rejects.toThrow('IMEI MISSING is not available');
    expect(product.quantity).toBe(1);
    expect(productSave).not.toHaveBeenCalled();
  });

  it('prevents concurrent overselling with a pessimistic product lock', async () => {
    const product = quantityProduct(1);
    const productQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([product]),
    };
    const productRepository = {
      createQueryBuilder: jest.fn(() => productQuery),
    } as unknown as Repository<Product>;
    const inventoryRepository = {} as Repository<InventoryUnit>;
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Product ? productRepository : inventoryRepository,
      ),
    } as unknown as EntityManager;
    const service = new InventoryService(
      inventoryRepository,
      productRepository,
    );

    await service.prepareSaleStock(
      [{ productId: product.id, quantity: 1 }],
      manager,
    );

    expect(productQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(productQuery.orderBy).toHaveBeenCalledWith('product.id', 'ASC');
  });
});
