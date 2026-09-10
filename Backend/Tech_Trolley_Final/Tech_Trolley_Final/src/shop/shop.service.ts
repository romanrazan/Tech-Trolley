import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { UpdateShopDto } from './dtos/update-shop.dto';

const INITIAL_SHOP: Omit<Shop, 'id'> = {
  name: 'Tech Trolley',
  address: 'House 12, Road 5, Block C\nBashundhara R/A, Dhaka 1229',
  phone: '+880 1712 345 678',
  currency: 'BDT',
};

@Injectable()
export class ShopService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  private async getOrCreate(manager: EntityManager): Promise<Shop> {
    // Serializes singleton initialization and updates, including when the table
    // is empty and there is no row available for a pessimistic lock.
    await manager.query('SELECT pg_advisory_xact_lock(847674731)');
    const repository = manager.getRepository(Shop);
    const [existing] = await repository.find({ order: { id: 'ASC' }, take: 1 });
    if (existing) return existing;

    return repository.save(repository.create(INITIAL_SHOP));
  }

  async getShopSettings(): Promise<Shop> {
    return this.dataSource.transaction((manager) => this.getOrCreate(manager));
  }

  async updateShopSettings(updateShopDto: UpdateShopDto): Promise<Shop> {
    return this.dataSource.transaction(async (manager) => {
      const shop = await this.getOrCreate(manager);
      const repository = manager.getRepository(Shop);
      return repository.save(repository.merge(shop, updateShopDto));
    });
  }
}
