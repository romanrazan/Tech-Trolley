import { Purchase } from '../../purchases/entities/purchase.entity';
export declare class Supplier {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    isActive: boolean;
    deletedAt: Date | null;
    purchases?: Purchase[];
}
