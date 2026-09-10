import { Product } from '../../products/entities/products.entity';
import { Purchase } from './purchase.entity';
export declare class PurchaseItem {
    id: string;
    purchaseId: string;
    purchase?: Purchase;
    productId: string;
    product?: Product;
    quantity: number;
    unitPrice: number;
    imeis: string[];
}
