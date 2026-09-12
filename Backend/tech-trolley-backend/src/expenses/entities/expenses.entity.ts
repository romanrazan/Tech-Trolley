import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/accounts.entity';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('uuid')
  accountId: string;

  @ManyToOne(() => Account, (account) => account.expenses)
  @JoinColumn({ name: 'accountId' })
  account?: Account;

  @Column('date')
  date: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
