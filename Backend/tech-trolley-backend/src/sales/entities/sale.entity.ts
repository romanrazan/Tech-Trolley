import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customers.entity';
import { InventoryUnit } from '../../inventory/entities/inventory-units.entity';
import { User } from '../../users/entities/users.entity';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';

export enum SaleStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETED = 'COMPLETED',
  RETURNED = 'RETURNED',
}

@Entity()
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceNumber: string;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.sales)
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Column('uuid')
  salespersonId: string;

  @ManyToOne(() => User, (user) => user.sales)
  @JoinColumn({ name: 'salespersonId' })
  salesperson?: User;

  @Column('date')
  date: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  subTotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  vat: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.IN_PROGRESS,
  })
  status: SaleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items?: SaleItem[];

  @OneToMany(() => SalePayment, (payment) => payment.sale)
  payments?: SalePayment[];

  @OneToMany(() => InventoryUnit, (unit) => unit.sale)
  inventoryUnits?: InventoryUnit[];
}
