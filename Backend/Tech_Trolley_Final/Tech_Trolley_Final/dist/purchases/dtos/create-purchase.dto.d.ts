import { CreateSupplierDto } from '../../suppliers/dtos/create-supplier.dto';
import { TrackingType } from '../../products/dtos/create-product.dto';
export declare class NewPurchaseProductDto {
    name: string;
    brandId: string;
    categoryId: string;
    trackingType: TrackingType;
    isActive: boolean;
}
export declare class PurchaseItemDto {
    productId?: string;
    newProduct?: NewPurchaseProductDto;
    private readonly productSelection?;
    quantity: number;
    unitPrice: number;
    imeis?: string[];
}
export declare class CreatePurchaseDto {
    invoiceNumber: string;
    supplierId?: string;
    newSupplier?: CreateSupplierDto;
    private readonly supplierSelection?;
    date: string;
    items: PurchaseItemDto[];
    remarks?: string;
}
