import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { AddPurchasePaymentDto } from './dtos/add-payment.dto';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(createPurchaseDto: CreatePurchaseDto): Promise<import("./entities/purchase.entity").Purchase>;
    findAll(): Promise<import("./purchases.service").PurchaseWithPaymentSummary[]>;
    findOne(id: string): Promise<{
        purchase: import("./purchases.service").PurchaseWithPaymentSummary;
        items: import("./entities/purchase-item.entity").PurchaseItem[];
        payments: import("./entities/purchase-payment.entity").PurchasePayment[];
    }>;
    addPayment(id: string, paymentDto: AddPurchasePaymentDto): Promise<import("./entities/purchase-payment.entity").PurchasePayment>;
}
