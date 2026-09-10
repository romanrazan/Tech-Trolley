import { Product } from '../../products/entities/products.entity';
export declare class Brand {
    id: string;
    name: string;
    isActive: boolean;
    products?: Product[];
}
