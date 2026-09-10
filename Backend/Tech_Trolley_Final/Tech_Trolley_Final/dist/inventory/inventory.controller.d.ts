import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    checkStock(): Promise<{
        serializedInStock: number;
        quantityInStock: number;
        soldUnits: number;
        damagedUnits: number;
    }>;
    searchImei(imei: string): Promise<import("./entities/inventory-units.entity").InventoryUnit>;
}
