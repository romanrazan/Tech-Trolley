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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const accounts_service_1 = require("../accounts/accounts.service");
const inventory_service_1 = require("../inventory/inventory.service");
const suppliers_entity_1 = require("../suppliers/entities/suppliers.entity");
const suppliers_service_1 = require("../suppliers/suppliers.service");
const purchase_item_entity_1 = require("./entities/purchase-item.entity");
const purchase_payment_entity_1 = require("./entities/purchase-payment.entity");
const purchase_entity_1 = require("./entities/purchase.entity");
const accounts_entity_1 = require("../accounts/entities/accounts.entity");
const products_service_1 = require("../products/products.service");
const products_entity_1 = require("../products/entities/products.entity");
let PurchasesService = class PurchasesService {
    purchasesRepository;
    itemsRepository;
    paymentsRepository;
    inventoryService;
    accountsService;
    suppliersService;
    productsService;
    dataSource;
    constructor(purchasesRepository, itemsRepository, paymentsRepository, inventoryService, accountsService, suppliersService, productsService, dataSource) {
        this.purchasesRepository = purchasesRepository;
        this.itemsRepository = itemsRepository;
        this.paymentsRepository = paymentsRepository;
        this.inventoryService = inventoryService;
        this.accountsService = accountsService;
        this.suppliersService = suppliersService;
        this.productsService = productsService;
        this.dataSource = dataSource;
    }
    toCents(value, label) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            throw new common_1.BadRequestException(`${label} must be a valid amount`);
        }
        const cents = Math.round((numeric + Number.EPSILON) * 100);
        if (Math.abs(numeric - cents / 100) > 1e-9) {
            throw new common_1.BadRequestException(`${label} cannot have more than 2 decimals`);
        }
        return cents;
    }
    withPaymentSummary(purchase, payments = purchase.payments ?? []) {
        const totalCents = this.toCents(purchase.total, 'Purchase total');
        const paidCents = payments.reduce((sum, payment) => sum + this.toCents(payment.amount, 'Purchase payment'), 0);
        return Object.assign(purchase, {
            totalPaid: paidCents / 100,
            currentDue: Math.max(0, totalCents - paidCents) / 100,
        });
    }
    async create(createPurchaseDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (Boolean(createPurchaseDto.supplierId) ===
                Boolean(createPurchaseDto.newSupplier)) {
                throw new common_1.BadRequestException('Provide either supplierId or newSupplier, but not both');
            }
            let supplierId;
            if (createPurchaseDto.newSupplier) {
                const supplier = await this.suppliersService.createPendingInTransaction(createPurchaseDto.newSupplier, queryRunner.manager);
                supplierId = supplier.id;
            }
            else {
                if (!createPurchaseDto.supplierId) {
                    throw new common_1.BadRequestException('Provide either supplierId or newSupplier, but not both');
                }
                const supplier = await queryRunner.manager.findOne(suppliers_entity_1.Supplier, {
                    where: { id: createPurchaseDto.supplierId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!supplier)
                    throw new common_1.NotFoundException('Supplier not found');
                if (!supplier.isActive) {
                    throw new common_1.BadRequestException('Supplier is pending until their first purchase payment');
                }
                supplierId = supplier.id;
            }
            if (!Array.isArray(createPurchaseDto.items) ||
                !createPurchaseDto.items.length) {
                throw new common_1.BadRequestException('At least one Product item is required');
            }
            const existingProductIds = createPurchaseDto.items
                .map((item) => item.productId)
                .filter((id) => Boolean(id));
            if (new Set(existingProductIds).size !== existingProductIds.length) {
                throw new common_1.BadRequestException('The same existing Product cannot be added more than once');
            }
            const existingProducts = existingProductIds.length
                ? await queryRunner.manager
                    .getRepository(products_entity_1.Product)
                    .createQueryBuilder('product')
                    .setLock('pessimistic_write')
                    .where('product.id IN (:...productIds)', {
                    productIds: [...existingProductIds].sort(),
                })
                    .andWhere('product."deletedAt" IS NULL')
                    .orderBy('product.id', 'ASC')
                    .getMany()
                : [];
            const existingProductMap = new Map(existingProducts.map((product) => [product.id, product]));
            for (const productId of existingProductIds) {
                const product = existingProductMap.get(productId);
                if (!product)
                    throw new common_1.NotFoundException('Product not found');
                if (!product.isActive) {
                    throw new common_1.BadRequestException(`${product.name} is inactive`);
                }
            }
            const newProductNames = new Set();
            const resolvedItems = [];
            for (const [index, item] of createPurchaseDto.items.entries()) {
                if (Boolean(item.productId) === Boolean(item.newProduct)) {
                    throw new common_1.BadRequestException(`Item ${index + 1}: provide either productId or newProduct, but not both`);
                }
                if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                    throw new common_1.BadRequestException(`Item ${index + 1} quantity must be a positive whole number`);
                }
                const priceCents = this.toCents(item.unitPrice, `Item ${index + 1} price`);
                if (priceCents <= 0) {
                    throw new common_1.BadRequestException(`Item ${index + 1} price must be greater than zero`);
                }
                let productId = item.productId;
                if (item.newProduct) {
                    const normalizedName = item.newProduct.name
                        .trim()
                        .toLocaleLowerCase();
                    if (!normalizedName) {
                        throw new common_1.BadRequestException(`Item ${index + 1} Product name is required`);
                    }
                    if (newProductNames.has(normalizedName)) {
                        throw new common_1.BadRequestException(`The new Product ${item.newProduct.name.trim()} is listed more than once`);
                    }
                    newProductNames.add(normalizedName);
                    const product = await this.productsService.createForPurchaseInTransaction(item.newProduct, queryRunner.manager);
                    productId = product.id;
                }
                resolvedItems.push({
                    productId: productId,
                    quantity: item.quantity,
                    unitPrice: priceCents / 100,
                    ...(item.imeis
                        ? { imeis: item.imeis.map((imei) => imei.trim()) }
                        : {}),
                });
            }
            const totalCents = resolvedItems.reduce((sum, item, index) => sum +
                item.quantity *
                    this.toCents(item.unitPrice, `Item ${index + 1} price`), 0);
            const purchase = queryRunner.manager.create(purchase_entity_1.Purchase, {
                invoiceNumber: createPurchaseDto.invoiceNumber,
                supplierId,
                date: createPurchaseDto.date,
                remarks: createPurchaseDto.remarks,
                total: totalCents / 100,
                status: purchase_entity_1.PurchaseStatus.IN_PROGRESS,
            });
            const savedPurchase = await queryRunner.manager.save(purchase);
            for (const item of resolvedItems) {
                await queryRunner.manager.save(queryRunner.manager.create(purchase_item_entity_1.PurchaseItem, {
                    purchaseId: savedPurchase.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    imeis: item.imeis,
                }));
            }
            await this.inventoryService.receiveStock(savedPurchase.id, resolvedItems, queryRunner.manager);
            await queryRunner.commitTransaction();
            return savedPurchase;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll() {
        const purchases = await this.purchasesRepository.find({
            relations: { supplier: true, payments: true },
            order: { createdAt: 'DESC' },
            withDeleted: true,
        });
        return purchases.map((purchase) => this.withPaymentSummary(purchase));
    }
    async findOne(id) {
        const purchase = await this.purchasesRepository.findOne({
            where: { id },
            relations: { supplier: true },
            withDeleted: true,
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        const items = await this.itemsRepository.find({
            where: { purchaseId: id },
            relations: { product: true },
            withDeleted: true,
        });
        const payments = await this.paymentsRepository.find({
            where: { purchaseId: id },
            relations: { account: true },
            order: { createdAt: 'ASC' },
            withDeleted: true,
        });
        return {
            purchase: this.withPaymentSummary(purchase, payments),
            items,
            payments,
        };
    }
    async addPayment(id, paymentDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const paymentMethod = (0, accounts_entity_1.normalizePaymentMethod)(paymentDto.paymentMethod);
            if (!paymentMethod) {
                throw new common_1.BadRequestException('Unsupported payment method');
            }
            const purchase = await queryRunner.manager.findOne(purchase_entity_1.Purchase, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!purchase)
                throw new common_1.NotFoundException('Purchase not found');
            if (purchase.status !== purchase_entity_1.PurchaseStatus.IN_PROGRESS &&
                purchase.status !== purchase_entity_1.PurchaseStatus.INCOMPLETE) {
                throw new common_1.BadRequestException(purchase.status === purchase_entity_1.PurchaseStatus.COMPLETED
                    ? 'Completed purchase has no outstanding due'
                    : 'Cannot add payment to a cancelled purchase');
            }
            const amountCents = this.toCents(paymentDto.amount, 'Paid amount');
            if (amountCents <= 0) {
                throw new common_1.BadRequestException('Paid amount must be greater than zero');
            }
            const totalCents = this.toCents(purchase.total, 'Purchase total');
            const previousPaid = await queryRunner.manager
                .getRepository(purchase_payment_entity_1.PurchasePayment)
                .sum('amount', { purchaseId: id });
            const previousPaidCents = this.toCents(previousPaid ?? 0, 'Total paid');
            const outstandingCents = Math.max(0, totalCents - previousPaidCents);
            if (outstandingCents === 0) {
                throw new common_1.BadRequestException('Completed purchase has no outstanding due');
            }
            if (amountCents > outstandingCents) {
                throw new common_1.BadRequestException(`Payment exceeds the outstanding due of ${outstandingCents / 100}`);
            }
            const transactionId = paymentDto.transactionId?.trim() || null;
            if (transactionId &&
                (await queryRunner.manager.getRepository(purchase_payment_entity_1.PurchasePayment).exists({
                    where: {
                        purchaseId: id,
                        transactionId,
                    },
                }))) {
                throw new common_1.BadRequestException('This supplier payment transaction has already been recorded');
            }
            const payment = queryRunner.manager.create(purchase_payment_entity_1.PurchasePayment, {
                ...paymentDto,
                amount: amountCents / 100,
                paymentMethod,
                transactionId,
                purchaseId: id,
            });
            await this.accountsService.recordOutflow(queryRunner.manager, paymentDto.accountId, amountCents / 100, paymentMethod);
            const savedPayment = await queryRunner.manager.save(payment);
            const totalPaidCents = previousPaidCents + amountCents;
            purchase.status =
                totalPaidCents === totalCents
                    ? purchase_entity_1.PurchaseStatus.COMPLETED
                    : purchase_entity_1.PurchaseStatus.INCOMPLETE;
            await queryRunner.manager.save(purchase_entity_1.Purchase, purchase);
            const supplier = await queryRunner.manager.findOne(suppliers_entity_1.Supplier, {
                where: { id: purchase.supplierId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!supplier)
                throw new common_1.NotFoundException('Supplier not found');
            if (!supplier.isActive) {
                supplier.isActive = true;
                await queryRunner.manager.save(suppliers_entity_1.Supplier, supplier);
            }
            await queryRunner.commitTransaction();
            return savedPayment;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof common_1.HttpException)
                throw error;
            throw new common_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_item_entity_1.PurchaseItem)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_payment_entity_1.PurchasePayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        accounts_service_1.AccountsService,
        suppliers_service_1.SuppliersService,
        products_service_1.ProductsService,
        typeorm_2.DataSource])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map