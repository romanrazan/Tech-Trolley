import { Product } from '../../products/entities/products.entity';
import { Sale } from './sale.entity';
export declare class SaleItem {
    id: string;
    saleId: string;
    sale?: Sale;
    productId: string;
    product?: Product;
    quantity: number;
    unitPrice: number;
    imeis: string[];
}
