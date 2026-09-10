import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { InventoryService } from '../inventory/inventory.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { AddPurchasePaymentDto } from './dtos/add-payment.dto';
import { CreatePurchaseDto } from './dtos/create-purchase.dto';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { Purchase } from './entities/purchase.entity';
import { ProductsService } from '../products/products.service';
export type PurchaseWithPaymentSummary = Purchase & {
    totalPaid: number;
    currentDue: number;
};
export declare class PurchasesService {
    private purchasesRepository;
    private itemsRepository;
    private paymentsRepository;
    private inventoryService;
    private accountsService;
    private suppliersService;
    private productsService;
    private dataSource;
    constructor(purchasesRepository: Repository<Purchase>, itemsRepository: Repository<PurchaseItem>, paymentsRepository: Repository<PurchasePayment>, inventoryService: InventoryService, accountsService: AccountsService, suppliersService: SuppliersService, productsService: ProductsService, dataSource: DataSource);
    private toCents;
    private withPaymentSummary;
    create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase>;
    findAll(): Promise<PurchaseWithPaymentSummary[]>;
    findOne(id: string): Promise<{
        purchase: PurchaseWithPaymentSummary;
        items: PurchaseItem[];
        payments: PurchasePayment[];
    }>;
    addPayment(id: string, paymentDto: AddPurchasePaymentDto): Promise<PurchasePayment>;
}
