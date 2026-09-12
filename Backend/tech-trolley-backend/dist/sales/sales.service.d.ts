import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { CreateSaleDto } from './dtos/create-sale.dto';
import { AddSalePaymentDto } from './dtos/add-payment.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AccountsService } from '../accounts/accounts.service';
import { CustomersService } from '../customers/customers.service';
import { UserRole } from '../auth/user-role.enum';
export type SaleWithPaymentSummary = Sale & {
    totalPaid: number;
    currentDue: number;
};
export declare class SalesService {
    private salesRepository;
    private itemsRepository;
    private paymentsRepository;
    private inventoryService;
    private accountsService;
    private customersService;
    private dataSource;
    constructor(salesRepository: Repository<Sale>, itemsRepository: Repository<SaleItem>, paymentsRepository: Repository<SalePayment>, inventoryService: InventoryService, accountsService: AccountsService, customersService: CustomersService, dataSource: DataSource);
    private toCents;
    private withPaymentSummary;
    create(createSaleDto: CreateSaleDto, salespersonId: string): Promise<Sale>;
    findAll(): Promise<SaleWithPaymentSummary[]>;
    findOne(id: string): Promise<{
        sale: SaleWithPaymentSummary;
        items: SaleItem[];
        payments: SalePayment[];
    }>;
    addPayment(id: string, paymentDto: AddSalePaymentDto, actor: {
        id: string;
        role: UserRole;
    }): Promise<SalePayment>;
}
