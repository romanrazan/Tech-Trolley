import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';

@Entity()
@Index('IDX_customer_active_name', ['name'], {
  where: '"deletedAt" IS NULL',
})
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales?: Sale[];
}
