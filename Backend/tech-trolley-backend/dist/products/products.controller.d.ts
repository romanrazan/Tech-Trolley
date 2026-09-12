import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdateProductStatusDto } from './dtos/update-product-status.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<import("./entities/products.entity").Product>;
    findAll(): Promise<import("./entities/products.entity").Product[]>;
    findOne(id: string): Promise<import("./entities/products.entity").Product>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<import("./entities/products.entity").Product>;
    updateStatus(id: string, updateProductStatusDto: UpdateProductStatusDto): Promise<import("./entities/products.entity").Product>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
