import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/accounts.entity';
import { Purchase } from './purchase.entity';

@Entity()
@Index('UQ_purchase_payment_transaction', ['purchaseId', 'transactionId'], {
  unique: true,
  where: '"transactionId" IS NOT NULL',
})
export class PurchasePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  purchaseId: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.payments)
  @JoinColumn({ name: 'purchaseId' })
  purchase?: Purchase;

  // Financial account that funded this payment (outflow source).
  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, (account) => account.purchasePayments)
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
