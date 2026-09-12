import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/products.entity';
import { Sale } from './sale.entity';

@Entity()
@Index('IDX_sale_item_productId', ['productId'])
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'saleId' })
  sale?: Sale;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'productId',
    foreignKeyConstraintName: 'FK_sale_item_product',
  })
  product?: Product;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('jsonb', { nullable: true })
  imeis: string[];
}
