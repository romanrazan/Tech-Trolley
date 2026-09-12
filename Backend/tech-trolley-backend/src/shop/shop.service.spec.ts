import { DataSource, EntityManager, Repository } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { ShopService } from './shop.service';

describe('ShopService', () => {
  function setup(existing?: Shop) {
    const created: Shop = {
      id: 'created-shop-id',
      name: 'Tech Trolley',
      address: 'House 12, Road 5, Block C\nBashundhara R/A, Dhaka 1229',
      phone: '+880 1712 345 678',
      currency: 'BDT',
    };
    const find = jest.fn().mockResolvedValue(existing ? [existing] : []);
    const create = jest.fn().mockReturnValue(created);
    const merge = jest.fn((shop: Shop, update: Partial<Shop>) =>
      Object.assign(shop, update),
    );
    const save = jest.fn((shop: Shop) => Promise.resolve(shop));
    const repository = {
      find,
      create,
      merge,
      save,
    } as unknown as Repository<Shop>;
    const query = jest.fn().mockResolvedValue([]);
    const manager = {
      query,
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn((work: (value: EntityManager) => unknown) =>
        work(manager),
      ),
    } as unknown as DataSource;
    const service = new ShopService(dataSource);

    return { service, created, find, create, merge, save, query };
  }

  it('returns the existing singleton shop record', async () => {
    const existing: Shop = {
      id: 'shop-id',
      name: 'Existing shop',
      address: 'Existing address',
      phone: '0123456789',
      currency: 'BDT',
    };
    const context = setup(existing);

    await expect(context.service.getShopSettings()).resolves.toBe(existing);
    expect(context.create).not.toHaveBeenCalled();
    expect(context.save).not.toHaveBeenCalled();
  });

  it('safely creates and returns the initial shop when none exists', async () => {
    const context = setup();

    await expect(context.service.getShopSettings()).resolves.toBe(
      context.created,
    );
    expect(context.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(847674731)',
    );
    expect(context.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Tech Trolley', currency: 'BDT' }),
    );
    expect(context.save).toHaveBeenCalledWith(context.created);
  });

  it('updates the singleton record with the owner-provided values', async () => {
    const existing: Shop = {
      id: 'shop-id',
      name: 'Old name',
      address: 'Old address',
      phone: 'Old phone',
      currency: 'BDT',
    };
    const context = setup(existing);
    const update = {
      name: 'Updated shop',
      address: 'Updated address',
      phone: '+880 1700 000 000',
      currency: 'USD',
    };

    await expect(context.service.updateShopSettings(update)).resolves.toEqual({
      id: 'shop-id',
      ...update,
    });
    expect(context.merge).toHaveBeenCalledWith(existing, update);
    expect(context.save).toHaveBeenCalledWith({
      id: 'shop-id',
      ...update,
    });
  });
});
