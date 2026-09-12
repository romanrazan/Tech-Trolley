import { Customer } from '../../customers/entities/customers.entity';
import { InventoryUnit } from '../../inventory/entities/inventory-units.entity';
import { User } from '../../users/entities/users.entity';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';
export declare enum SaleStatus {
    IN_PROGRESS = "IN_PROGRESS",
    INCOMPLETE = "INCOMPLETE",
    COMPLETED = "COMPLETED",
    RETURNED = "RETURNED"
}
export declare class Sale {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customer?: Customer;
    salespersonId: string;
    salesperson?: User;
    date: string;
    subTotal: number;
    discount: number;
    vat: number;
    total: number;
    status: SaleStatus;
    createdAt: Date;
    items?: SaleItem[];
    payments?: SalePayment[];
    inventoryUnits?: InventoryUnit[];
}
