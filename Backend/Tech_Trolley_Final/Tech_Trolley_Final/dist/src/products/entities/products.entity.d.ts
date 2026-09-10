import { Brand } from '../../brands/entities/brands.entity';
import { Category } from '../../categories/entities/categories.entity';
export declare class Product {
    id: string;
    name: string;
    brandId: string;
    brand?: Brand;
    categoryId: string;
    category?: Category;
    trackingType: string;
    quantity: number;
    isActive: boolean;
    deletedAt: Date | null;
}
