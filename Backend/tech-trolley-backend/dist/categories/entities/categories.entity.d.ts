import { Product } from '../../products/entities/products.entity';
export declare class Category {
    id: string;
    name: string;
    isActive: boolean;
    products?: Product[];
}
