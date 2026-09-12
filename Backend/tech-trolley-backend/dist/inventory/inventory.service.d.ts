import { EntityManager, Repository } from 'typeorm';
import { Product } from '../products/entities/products.entity';
import { InventoryUnit } from './entities/inventory-units.entity';
interface InventoryItem {
    productId: string;
    quantity: number;
    imeis?: string[];
}
export type LockedProductMap = Map<string, Product>;
export declare class InventoryService {
    private readonly inventoryRepository;
    private readonly productRepository;
    constructor(inventoryRepository: Repository<InventoryUnit>, productRepository: Repository<Product>);
    private inventoryRepo;
    private productRepo;
    private aggregateQuantities;
    private productsForItems;
    private collectSerializedImeis;
    prepareSaleStock(items: InventoryItem[], manager: EntityManager): Promise<LockedProductMap>;
    receiveStock(purchaseId: string | null, items: InventoryItem[], manager?: EntityManager): Promise<InventoryUnit[]>;
    checkAvailability(items: InventoryItem[]): Promise<void>;
    issueStock(saleId: string, items: InventoryItem[], manager?: EntityManager, preparedProducts?: LockedProductMap): Promise<void>;
    checkStock(): Promise<{
        serializedInStock: number;
        quantityInStock: number;
        soldUnits: number;
        damagedUnits: number;
    }>;
    searchImei(imei: string): Promise<InventoryUnit>;
}
export {};
