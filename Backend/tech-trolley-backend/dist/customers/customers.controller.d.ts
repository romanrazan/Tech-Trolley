import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<import("./entities/customers.entity").Customer>;
    findAll(): Promise<import("./customers.service").CustomerSummary[]>;
    getDetails(id: string): Promise<import("./customers.service").CustomerDetails>;
    findOne(id: string): Promise<import("./entities/customers.entity").Customer>;
    update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<import("./entities/customers.entity").Customer>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getDues(id: string): Promise<{
        due: number;
    }>;
}
