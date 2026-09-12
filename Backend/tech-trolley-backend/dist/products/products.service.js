"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_entity_1 = require("./entities/products.entity");
const create_product_dto_1 = require("./dtos/create-product.dto");
const inventory_service_1 = require("../inventory/inventory.service");
const inventory_units_entity_1 = require("../inventory/entities/inventory-units.entity");
const sale_item_entity_1 = require("../sales/entities/sale-item.entity");
const sale_entity_1 = require("../sales/entities/sale.entity");
const purchase_item_entity_1 = require("../purchases/entities/purchase-item.entity");
const purchase_entity_1 = require("../purchases/entities/purchase.entity");
const brands_entity_1 = require("../brands/entities/brands.entity");
const categories_entity_1 = require("../categories/entities/categories.entity");
let ProductsService = class ProductsService {
    productsRepository;
    inventoryService;
    dataSource;
    constructor(productsRepository, inventoryService, dataSource) {
        this.productsRepository = productsRepository;
        this.inventoryService = inventoryService;
        this.dataSource = dataSource;
    }
    async create(createProductDto) {
        if (!Number.isInteger(createProductDto.quantity)) {
            throw new common_1.BadRequestException('Initial quantity must be an integer');
        }
        if (createProductDto.quantity < 0) {
            throw new common_1.BadRequestException('Initial quantity cannot be negative');
        }
        if (createProductDto.trackingType === create_product_dto_1.TrackingType.SERIALIZED &&
            createProductDto.quantity !== 0) {
            throw new common_1.BadRequestException('Serialized products must start with quantity 0; add stock through Purchase with IMEIs');
        }
        return this.dataSource.transaction(async (manager) => {
            const { quantity, ...productInput } = createProductDto;
            const product = manager.create(products_entity_1.Product, {
                ...productInput,
                quantity: 0,
            });
            const savedProduct = await manager.save(products_entity_1.Product, product);
            if (quantity > 0) {
                await this.inventoryService.receiveStock(null, [{ productId: savedProduct.id, quantity }], manager);
                savedProduct.quantity = quantity;
            }
            return savedProduct;
        });
    }
    async createForPurchaseInTransaction(input, manager) {
        const name = input.name.trim();
        if (!name) {
            throw new common_1.BadRequestException('Product name is required');
        }
        if (typeof input.isActive !== 'boolean') {
            throw new common_1.BadRequestException('Product active status must be valid');
        }
        const [brand, category, duplicate] = await Promise.all([
            manager.getRepository(brands_entity_1.Brand).findOne({
                where: { id: input.brandId, isActive: true },
            }),
            manager.getRepository(categories_entity_1.Category).findOne({
                where: { id: input.categoryId, isActive: true },
            }),
            manager.getRepository(products_entity_1.Product).findOne({
                where: {
                    name: (0, typeorm_2.Raw)((column) => `LOWER(${column}) = LOWER(:name)`, { name }),
                },
                withDeleted: true,
            }),
        ]);
        if (!brand) {
            throw new common_1.BadRequestException('Select an active Brand');
        }
        if (!category) {
            throw new common_1.BadRequestException('Select an active Category');
        }
        if (duplicate) {
            throw new common_1.ConflictException(`A Product named ${name} already exists. Select the existing Product instead.`);
        }
        const repository = manager.getRepository(products_entity_1.Product);
        return repository.save(repository.create({
            ...input,
            name,
            quantity: 0,
        }));
    }
    async findAll() {
        return this.productsRepository.find();
    }
    async findOne(id) {
        const product = await this.productsRepository.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        Object.assign(product, updateProductDto);
        return this.productsRepository.save(product);
    }
    async updateStatus(id, updateProductStatusDto) {
        const product = await this.findOne(id);
        product.isActive = updateProductStatusDto.isActive;
        return this.productsRepository.save(product);
    }
    async remove(id) {
        return this.dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(products_entity_1.Product);
            const product = await repository.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!product)
                throw new common_1.NotFoundException('Product not found');
            if (Number(product.quantity) > 0) {
                throw new common_1.ConflictException(`This product cannot be deleted because ${product.quantity} units are still in stock.`);
            }
            const inventoryRepository = manager.getRepository(inventory_units_entity_1.InventoryUnit);
            const inStockImei = await inventoryRepository.findOne({
                where: {
                    productId: id,
                    status: inventory_units_entity_1.InventoryStatus.IN_STOCK,
                    imei: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
                },
                lock: { mode: 'pessimistic_write' },
            });
            if (inStockImei) {
                throw new common_1.ConflictException('This product cannot be deleted because it has active serialized IMEIs.');
            }
            const activeSaleItem = await manager.getRepository(sale_item_entity_1.SaleItem).findOne({
                where: {
                    productId: id,
                    sale: {
                        status: (0, typeorm_2.In)([sale_entity_1.SaleStatus.IN_PROGRESS, sale_entity_1.SaleStatus.INCOMPLETE]),
                    },
                },
                relations: { sale: true },
            });
            const activePurchaseItem = await manager
                .getRepository(purchase_item_entity_1.PurchaseItem)
                .findOne({
                where: {
                    productId: id,
                    purchase: {
                        status: (0, typeorm_2.In)([
                            purchase_entity_1.PurchaseStatus.IN_PROGRESS,
                            purchase_entity_1.PurchaseStatus.INCOMPLETE,
                        ]),
                    },
                },
                relations: { purchase: true },
            });
            if (activeSaleItem || activePurchaseItem) {
                throw new common_1.ConflictException('This product is connected to an active transaction.');
            }
            const inStockInventory = await inventoryRepository.findOne({
                where: { productId: id, status: inventory_units_entity_1.InventoryStatus.IN_STOCK },
                lock: { mode: 'pessimistic_write' },
            });
            if (inStockInventory) {
                throw new common_1.ConflictException('This product cannot be deleted because active inventory records remain.');
            }
            await repository.softRemove(product);
            return { message: 'Product deleted successfully.' };
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        inventory_service_1.InventoryService,
        typeorm_2.DataSource])
], ProductsService);
//# sourceMappingURL=products.service.js.map