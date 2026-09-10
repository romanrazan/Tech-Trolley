import {
  Check,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Brand } from '../../brands/entities/brands.entity';
import { Category } from '../../categories/entities/categories.entity';

@Entity()
@Check('CHK_product_quantity_non_negative', '"quantity" >= 0')
@Index('IDX_product_active_name', ['name'], {
  where: '"deletedAt" IS NULL',
})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('uuid')
  brandId: string;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brandId' })
  brand?: Brand;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({
    type: 'enum',
    enum: ['SERIALIZED', 'QUANTITY'],
  })
  trackingType: string;

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @Column({ default: true })
  isActive: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
