import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { InventoryUnit } from '../../inventory/entities/inventory-units.entity';
import { Supplier } from '../../suppliers/entities/suppliers.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchasePayment } from './purchase-payment.entity';

export enum PurchaseStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceNumber: string;

  @Column('uuid')
  supplierId: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchases)
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @Column('date')
  date: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.IN_PROGRESS,
  })
  status: PurchaseStatus;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PurchaseItem, (item) => item.purchase)
  items?: PurchaseItem[];

  @OneToMany(() => PurchasePayment, (payment) => payment.purchase)
  payments?: PurchasePayment[];

  @OneToMany(() => InventoryUnit, (unit) => unit.purchase)
  inventoryUnits?: InventoryUnit[];
}
