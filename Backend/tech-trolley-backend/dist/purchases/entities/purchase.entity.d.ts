import { InventoryUnit } from '../../inventory/entities/inventory-units.entity';
import { Supplier } from '../../suppliers/entities/suppliers.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchasePayment } from './purchase-payment.entity';
export declare enum PurchaseStatus {
    IN_PROGRESS = "IN_PROGRESS",
    INCOMPLETE = "INCOMPLETE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class Purchase {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    supplier?: Supplier;
    date: string;
    total: number;
    status: PurchaseStatus;
    remarks: string;
    createdAt: Date;
    items?: PurchaseItem[];
    payments?: PurchasePayment[];
    inventoryUnits?: InventoryUnit[];
}
