import { SalesService } from './sales.service';
import { CreateSaleDto } from './dtos/create-sale.dto';
import { AddSalePaymentDto } from './dtos/add-payment.dto';
import { UserRole } from '../auth/user-role.enum';
interface AuthenticatedRequest {
    user: {
        id: string;
        role: UserRole;
    };
}
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto, req: AuthenticatedRequest): Promise<import("./entities/sale.entity").Sale>;
    findAll(): Promise<import("./sales.service").SaleWithPaymentSummary[]>;
    findOne(id: string): Promise<{
        sale: import("./sales.service").SaleWithPaymentSummary;
        items: import("./entities/sale-item.entity").SaleItem[];
        payments: import("./entities/sale-payment.entity").SalePayment[];
    }>;
    addPayment(id: string, paymentDto: AddSalePaymentDto, req: AuthenticatedRequest): Promise<import("./entities/sale-payment.entity").SalePayment>;
}
export {};
