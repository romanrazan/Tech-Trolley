import { DataSource, EntityManager, Repository } from 'typeorm';
import { PurchaseStatus } from '../purchases/entities/purchase.entity';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { Supplier } from './entities/suppliers.entity';
export interface SupplierSummary extends Supplier {
    totalPurchases: number;
    totalPaid: number;
    due: number;
}
export interface SupplierDetails {
    supplier: Supplier;
    summary: {
        totalPurchases: number;
        totalPaid: number;
        totalDue: number;
    };
    purchases: Array<{
        id: string;
        date: string;
        invoiceNumber: string;
        status: PurchaseStatus;
        total: number;
        paidAmount: number;
        remainingDue: number;
        remarks: string | null;
        items: Array<{
            id: string;
            productId: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            imeis: string[];
        }>;
        payments: Array<{
            id: string;
            amount: number;
            paymentMethod: string;
            transactionId: string | null;
            date: string;
        }>;
    }>;
}
export declare class SuppliersService {
    private suppliersRepository;
    private dataSource;
    constructor(suppliersRepository: Repository<Supplier>, dataSource: DataSource);
    private duplicateMessage;
    private isUniqueViolation;
    create(createSupplierDto: CreateSupplierDto): Promise<Supplier>;
    createInTransaction(createSupplierDto: CreateSupplierDto, manager?: EntityManager): Promise<Supplier>;
    createPendingInTransaction(createSupplierDto: CreateSupplierDto, manager: EntityManager): Promise<Supplier>;
    private createWithStatus;
    findAll(): Promise<SupplierSummary[]>;
    findOne(id: string): Promise<Supplier>;
    update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getDues(id: string): Promise<{
        due: number;
    }>;
    getDetails(id: string): Promise<SupplierDetails>;
}
