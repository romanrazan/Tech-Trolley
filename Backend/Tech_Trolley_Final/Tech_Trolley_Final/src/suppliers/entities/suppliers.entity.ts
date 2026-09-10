import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Purchase } from '../../purchases/entities/purchase.entity';

@Entity()
@Index('UQ_supplier_phone', ['phone'], { unique: true })
@Index('UQ_supplier_email', ['email'], { unique: true })
@Index('IDX_supplier_active_name', ['name'], {
  where: '"deletedAt" IS NULL',
})
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Purchase, (purchase) => purchase.supplier)
  purchases?: Purchase[];
}
