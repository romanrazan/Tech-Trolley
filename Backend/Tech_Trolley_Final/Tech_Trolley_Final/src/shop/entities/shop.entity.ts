import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  currency: string;
}
