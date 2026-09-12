import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Expense } from '../../expenses/entities/expenses.entity';
import { PurchasePayment } from '../../purchases/entities/purchase-payment.entity';
import { SalePayment } from '../../sales/entities/sale-payment.entity';

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Mobile Wallet',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const ACCOUNT_TYPES_BY_METHOD: Record<PaymentMethod, readonly string[]> = {
  Cash: ['cash'],
  'Bank Transfer': ['bank', 'bank account'],
  'Mobile Wallet': [
    'mobile wallet',
    'mobile banking',
    'mobile banking account',
    'wallet',
  ],
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

export function normalizePaymentMethod(value: string): PaymentMethod | null {
  const normalized = normalize(value);
  return (
    PAYMENT_METHODS.find((method) => normalize(method) === normalized) ?? null
  );
}

export function isAccountTypeCompatible(
  paymentMethod: PaymentMethod,
  accountType: string,
): boolean {
  return ACCOUNT_TYPES_BY_METHOD[paymentMethod].includes(
    normalize(accountType),
  );
}

@Entity()
@Index('IDX_account_active_name', ['name'], {
  where: '"deletedAt" IS NULL',
})
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Expense, (expense) => expense.account)
  expenses?: Expense[];

  @OneToMany(() => PurchasePayment, (payment) => payment.account)
  purchasePayments?: PurchasePayment[];

  @OneToMany(() => SalePayment, (payment) => payment.account)
  salePayments?: SalePayment[];
}
