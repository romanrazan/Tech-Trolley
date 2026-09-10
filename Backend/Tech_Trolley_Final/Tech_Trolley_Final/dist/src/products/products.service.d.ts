import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { CreateProductDto, TrackingType } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdateProductStatusDto } from './dtos/update-product-status.dto';
import { InventoryService } from '../inventory/inventory.service';
export interface PurchaseProductInput {
    name: string;
    brandId: string;
    categoryId: string;
    trackingType: TrackingType;
    isActive: boolean;
}
export declare class ProductsService {
    private productsRepository;
    private inventoryService;
    private dataSource;
    constructor(productsRepository: Repository<Product>, inventoryService: InventoryService, dataSource: DataSource);
    create(createProductDto: CreateProductDto): Promise<Product>;
    createForPurchaseInTransaction(input: PurchaseProductInput, manager: EntityManager): Promise<Product>;
    findAll(): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<Product>;
    updateStatus(id: string, updateProductStatusDto: UpdateProductStatusDto): Promise<Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
