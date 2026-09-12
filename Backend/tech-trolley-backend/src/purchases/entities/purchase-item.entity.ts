import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/products.entity';
import { Purchase } from './purchase.entity';

@Entity()
@Index('IDX_purchase_item_productId', ['productId'])
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  purchaseId: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  @JoinColumn({ name: 'purchaseId' })
  purchase?: Purchase;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'productId',
    foreignKeyConstraintName: 'FK_purchase_item_product',
  })
  product?: Product;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('jsonb', { nullable: true })
  imeis: string[];
}
