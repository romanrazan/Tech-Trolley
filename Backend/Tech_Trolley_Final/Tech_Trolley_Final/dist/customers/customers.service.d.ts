import { DataSource, EntityManager, Repository } from 'typeorm';
import { Customer } from './entities/customers.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
export interface CustomerSummary extends Customer {
    totalSales: number;
    totalPaid: number;
    due: number;
}
export interface CustomerDetails {
    customer: Customer;
    summary: {
        totalSales: number;
        totalPaid: number;
        totalDue: number;
    };
    sales: Array<{
        id: string;
        date: string;
        invoiceNumber: string;
        status: string;
        total: number;
        paidAmount: number;
        remainingDue: number;
        items: Array<{
            id: string;
            productId: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            imeis: string[];
        }>;
    }>;
}
export declare class CustomersService {
    private customersRepository;
    private dataSource;
    constructor(customersRepository: Repository<Customer>, dataSource: DataSource);
    private duplicatePhoneMessage;
    private isUniqueViolation;
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    createInTransaction(createCustomerDto: CreateCustomerDto, manager?: EntityManager): Promise<Customer>;
    createPendingInTransaction(createCustomerDto: CreateCustomerDto, manager: EntityManager): Promise<Customer>;
    private createWithStatus;
    findAll(): Promise<CustomerSummary[]>;
    findOne(id: string): Promise<Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getDues(id: string): Promise<{
        due: number;
    }>;
    getDetails(id: string): Promise<CustomerDetails>;
}
