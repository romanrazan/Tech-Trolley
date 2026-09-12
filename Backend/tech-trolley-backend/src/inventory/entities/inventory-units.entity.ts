import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/products.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Sale } from '../../sales/entities/sale.entity';

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
  DAMAGED = 'DAMAGED',
}

@Entity()
@Index('IDX_inventory_unit_productId', ['productId'])
@Index('IDX_inventory_unit_imei_unique', ['imei'], {
  unique: true,
  where: '"imei" IS NOT NULL',
})
export class InventoryUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'productId',
    foreignKeyConstraintName: 'FK_inventory_unit_product',
  })
  product?: Product;

  @Column({ type: 'varchar', nullable: true })
  imei: string | null;

  @Column({ default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.IN_STOCK,
  })
  status: InventoryStatus;

  @Column('uuid', { nullable: true })
  purchaseId: string | null;

  @ManyToOne(() => Purchase, (purchase) => purchase.inventoryUnits, {
    nullable: true,
  })
  @JoinColumn({ name: 'purchaseId' })
  purchase?: Purchase;

  @Column('uuid', { nullable: true })
  saleId: string | null;

  @ManyToOne(() => Sale, (sale) => sale.inventoryUnits, { nullable: true })
  @JoinColumn({ name: 'saleId' })
  sale?: Sale;
}
