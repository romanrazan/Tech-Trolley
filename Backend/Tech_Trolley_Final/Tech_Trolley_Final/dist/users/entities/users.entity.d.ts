import { UserRole } from '../../auth/user-role.enum';
import { Sale } from '../../sales/entities/sale.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    sales?: Sale[];
}
