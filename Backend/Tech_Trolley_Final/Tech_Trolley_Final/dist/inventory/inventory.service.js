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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const products_entity_1 = require("../products/entities/products.entity");
const inventory_units_entity_1 = require("./entities/inventory-units.entity");
let InventoryService = class InventoryService {
    inventoryRepository;
    productRepository;
    constructor(inventoryRepository, productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }
    inventoryRepo(manager) {
        return manager
            ? manager.getRepository(inventory_units_entity_1.InventoryUnit)
            : this.inventoryRepository;
    }
    productRepo(manager) {
        return manager ? manager.getRepository(products_entity_1.Product) : this.productRepository;
    }
    aggregateQuantities(items) {
        const quantities = new Map();
        for (const item of items) {
            quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        }
        return quantities;
    }
    async productsForItems(items, manager, lock = false) {
        if (items.length === 0) {
            throw new common_1.BadRequestException('At least one product is required.');
        }
        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                throw new common_1.BadRequestException('Product quantities must be positive whole numbers.');
            }
        }
        const productIds = [...new Set(items.map((item) => item.productId))].sort();
        const repository = this.productRepo(manager);
        const products = manager && lock
            ? await repository
                .createQueryBuilder('product')
                .setLock('pessimistic_write')
                .where('product.id IN (:...productIds)', { productIds })
                .orderBy('product.id', 'ASC')
                .getMany()
            : await repository.find({ where: { id: (0, typeorm_2.In)(productIds) } });
        const productMap = new Map(products.map((product) => [product.id, product]));
        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new common_1.NotFoundException(`Product ${item.productId} not found.`);
            }
            if (product.trackingType === 'SERIALIZED') {
                if (!item.imeis || item.imeis.length !== item.quantity) {
                    throw new common_1.BadRequestException(`${product.name} requires exactly one IMEI for every unit.`);
                }
                if (item.imeis.some((imei) => !imei.trim())) {
                    throw new common_1.BadRequestException(`${product.name} has an empty IMEI.`);
                }
            }
            else if (item.imeis?.length) {
                throw new common_1.BadRequestException(`${product.name} is quantity tracked and cannot have IMEIs.`);
            }
        }
        return productMap;
    }
    collectSerializedImeis(items, products) {
        const imeis = [];
        for (const item of items) {
            const product = products.get(item.productId);
            if (product.trackingType === 'SERIALIZED') {
                imeis.push(...(item.imeis ?? []).map((imei) => imei.trim()));
            }
        }
        if (new Set(imeis).size !== imeis.length) {
            throw new common_1.BadRequestException('Duplicate IMEIs are not allowed.');
        }
        return imeis;
    }
    async prepareSaleStock(items, manager) {
        const products = await this.productsForItems(items, manager, true);
        this.collectSerializedImeis(items, products);
        const requested = this.aggregateQuantities(items);
        for (const [productId, quantity] of requested) {
            const product = products.get(productId);
            const available = product.quantity ?? 0;
            if (!product.isActive) {
                throw new common_1.BadRequestException(`${product.name} is inactive.`);
            }
            if (available <= 0) {
                throw new common_1.BadRequestException(`${product.name} is out of stock.`);
            }
            if (quantity > available) {
                throw new common_1.BadRequestException(`Only ${available} units of ${product.name} are available.`);
            }
        }
        return products;
    }
    async receiveStock(purchaseId, items, manager) {
        const inventoryRepository = this.inventoryRepo(manager);
        const productRepository = this.productRepo(manager);
        const products = await this.productsForItems(items, manager, Boolean(manager));
        const imeis = this.collectSerializedImeis(items, products);
        if (imeis.length > 0) {
            const existing = await inventoryRepository.find({
                where: { imei: (0, typeorm_2.In)(imeis) },
            });
            if (existing.length > 0) {
                throw new common_1.BadRequestException(`IMEI ${existing[0].imei} already exists in inventory.`);
            }
        }
        const units = [];
        for (const item of items) {
            const product = products.get(item.productId);
            if (product.trackingType === 'SERIALIZED') {
                for (const imei of item.imeis ?? []) {
                    units.push(inventoryRepository.create({
                        productId: item.productId,
                        purchaseId: purchaseId ?? undefined,
                        imei: imei.trim(),
                        quantity: 1,
                        status: inventory_units_entity_1.InventoryStatus.IN_STOCK,
                    }));
                }
            }
            else {
                units.push(inventoryRepository.create({
                    productId: item.productId,
                    purchaseId: purchaseId ?? undefined,
                    quantity: item.quantity,
                    status: inventory_units_entity_1.InventoryStatus.IN_STOCK,
                }));
            }
        }
        const savedUnits = await inventoryRepository.save(units);
        const received = this.aggregateQuantities(items);
        const changedProducts = [];
        for (const [productId, quantity] of received) {
            const product = products.get(productId);
            product.quantity = (product.quantity ?? 0) + quantity;
            changedProducts.push(product);
        }
        await productRepository.save(changedProducts);
        return savedUnits;
    }
    async checkAvailability(items) {
        const products = await this.productsForItems(items);
        const requested = this.aggregateQuantities(items);
        for (const [productId, quantity] of requested) {
            const product = products.get(productId);
            const available = product.quantity ?? 0;
            if (!product.isActive) {
                throw new common_1.BadRequestException(`${product.name} is inactive.`);
            }
            if (available <= 0) {
                throw new common_1.BadRequestException(`${product.name} is out of stock.`);
            }
            if (quantity > available) {
                throw new common_1.BadRequestException(`Only ${available} units of ${product.name} are available.`);
            }
        }
    }
    async issueStock(saleId, items, manager, preparedProducts) {
        const inventoryRepository = this.inventoryRepo(manager);
        const productRepository = this.productRepo(manager);
        const products = preparedProducts ??
            (manager
                ? await this.prepareSaleStock(items, manager)
                : await this.productsForItems(items));
        const requested = this.aggregateQuantities(items);
        if (!manager) {
            for (const [productId, quantity] of requested) {
                const product = products.get(productId);
                const available = product.quantity ?? 0;
                if (!product.isActive) {
                    throw new common_1.BadRequestException(`${product.name} is inactive.`);
                }
                if (available <= 0) {
                    throw new common_1.BadRequestException(`${product.name} is out of stock.`);
                }
                if (quantity > available) {
                    throw new common_1.BadRequestException(`Only ${available} units of ${product.name} are available.`);
                }
            }
        }
        this.collectSerializedImeis(items, products);
        for (const item of items) {
            const product = products.get(item.productId);
            if (product.trackingType === 'SERIALIZED') {
                for (const rawImei of item.imeis ?? []) {
                    const imei = rawImei.trim();
                    const unit = await inventoryRepository.findOne({
                        where: { imei },
                        ...(manager
                            ? { lock: { mode: 'pessimistic_write' } }
                            : {}),
                    });
                    if (!unit ||
                        unit.productId !== item.productId ||
                        unit.status !== inventory_units_entity_1.InventoryStatus.IN_STOCK) {
                        throw new common_1.BadRequestException(`IMEI ${imei} is not available for ${product.name}.`);
                    }
                    unit.status = inventory_units_entity_1.InventoryStatus.SOLD;
                    unit.saleId = saleId;
                    await inventoryRepository.save(unit);
                }
            }
            else {
                const query = inventoryRepository
                    .createQueryBuilder('unit')
                    .where('unit.productId = :productId', {
                    productId: item.productId,
                })
                    .andWhere('unit.status = :status', {
                    status: inventory_units_entity_1.InventoryStatus.IN_STOCK,
                })
                    .orderBy('unit.id', 'ASC');
                if (manager) {
                    query.setLock('pessimistic_write');
                }
                const availableUnits = await query.getMany();
                let remaining = item.quantity;
                for (const unit of availableUnits) {
                    if (remaining === 0)
                        break;
                    if (unit.quantity <= remaining) {
                        unit.status = inventory_units_entity_1.InventoryStatus.SOLD;
                        unit.saleId = saleId;
                        remaining -= unit.quantity;
                        await inventoryRepository.save(unit);
                    }
                    else {
                        unit.quantity -= remaining;
                        await inventoryRepository.save(unit);
                        const soldUnit = inventoryRepository.create({
                            productId: unit.productId,
                            purchaseId: unit.purchaseId,
                            saleId,
                            quantity: remaining,
                            status: inventory_units_entity_1.InventoryStatus.SOLD,
                        });
                        await inventoryRepository.save(soldUnit);
                        remaining = 0;
                    }
                }
                if (remaining > 0) {
                    throw new common_1.BadRequestException(`Inventory records for ${product.name} are inconsistent with its available quantity.`);
                }
            }
        }
        const changedProducts = [];
        for (const [productId, quantity] of requested) {
            const product = products.get(productId);
            product.quantity -= quantity;
            changedProducts.push(product);
        }
        await productRepository.save(changedProducts);
    }
    async checkStock() {
        const units = await this.inventoryRepository.find();
        return {
            serializedInStock: units.filter((unit) => unit.imei && unit.status === inventory_units_entity_1.InventoryStatus.IN_STOCK).length,
            quantityInStock: units
                .filter((unit) => !unit.imei && unit.status === inventory_units_entity_1.InventoryStatus.IN_STOCK)
                .reduce((total, unit) => total + unit.quantity, 0),
            soldUnits: units.filter((unit) => unit.status === inventory_units_entity_1.InventoryStatus.SOLD)
                .length,
            damagedUnits: units.filter((unit) => unit.status === inventory_units_entity_1.InventoryStatus.DAMAGED).length,
        };
    }
    async searchImei(imei) {
        const inventoryUnit = await this.inventoryRepository.findOne({
            where: { imei },
            relations: { product: true, purchase: true, sale: true },
            withDeleted: true,
        });
        if (!inventoryUnit) {
            throw new common_1.NotFoundException(`IMEI ${imei} not found.`);
        }
        return inventoryUnit;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_units_entity_1.InventoryUnit)),
    __param(1, (0, typeorm_1.InjectRepository)(products_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map