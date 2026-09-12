import { Product } from '../../products/entities/products.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Sale } from '../../sales/entities/sale.entity';
export declare enum InventoryStatus {
    IN_STOCK = "IN_STOCK",
    SOLD = "SOLD",
    DAMAGED = "DAMAGED"
}
export declare class InventoryUnit {
    id: string;
    productId: string;
    product?: Product;
    imei: string | null;
    quantity: number;
    status: InventoryStatus;
    purchaseId: string | null;
    purchase?: Purchase;
    saleId: string | null;
    sale?: Sale;
}
