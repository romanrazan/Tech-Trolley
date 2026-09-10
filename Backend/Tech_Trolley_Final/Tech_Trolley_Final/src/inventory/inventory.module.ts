import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryUnit } from './entities/inventory-units.entity';
import { Product } from '../products/entities/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryUnit, Product])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
