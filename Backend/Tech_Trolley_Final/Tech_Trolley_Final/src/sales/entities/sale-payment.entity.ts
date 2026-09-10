import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/accounts.entity';
import { Sale } from './sale.entity';

@Entity()
export class SalePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.payments)
  @JoinColumn({ name: 'saleId' })
  sale?: Sale;

  // Financial account that received this payment (inflow target).
  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, (account) => account.salePayments)
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string;

  @Column('varchar', { nullable: true })
  transactionId: string | null;

  @Column('date')
  date: string;

  @CreateDateColumn()
  createdAt: Date;
}
