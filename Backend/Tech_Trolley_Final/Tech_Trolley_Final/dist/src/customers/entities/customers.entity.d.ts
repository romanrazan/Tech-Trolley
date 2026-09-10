import { Sale } from '../../sales/entities/sale.entity';
export declare class Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
    deletedAt: Date | null;
    sales?: Sale[];
}
