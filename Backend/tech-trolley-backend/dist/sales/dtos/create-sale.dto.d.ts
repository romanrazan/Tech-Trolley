import { CreateCustomerDto } from '../../customers/dtos/create-customer.dto';
declare class SaleItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    imeis?: string[];
}
export declare class CreateSaleDto {
    invoiceNumber: string;
    customerId?: string;
    newCustomer?: CreateCustomerDto;
    private readonly customerSelection?;
    date: string;
    discount: number;
    vat: number;
    items: SaleItemDto[];
}
export {};
