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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("./entities/sale.entity");
const sale_item_entity_1 = require("./entities/sale-item.entity");
const sale_payment_entity_1 = require("./entities/sale-payment.entity");
const inventory_service_1 = require("../inventory/inventory.service");
const accounts_service_1 = require("../accounts/accounts.service");
const customers_entity_1 = require("../customers/entities/customers.entity");
const customers_service_1 = require("../customers/customers.service");
const accounts_entity_1 = require("../accounts/entities/accounts.entity");
const user_role_enum_1 = require("../auth/user-role.enum");
let SalesService = class SalesService {
    salesRepository;
    itemsRepository;
    paymentsRepository;
    inventoryService;
    accountsService;
    customersService;
    dataSource;
    constructor(salesRepository, itemsRepository, paymentsRepository, inventoryService, accountsService, customersService, dataSource) {
        this.salesRepository = salesRepository;
        this.itemsRepository = itemsRepository;
        this.paymentsRepository = paymentsRepository;
        this.inventoryService = inventoryService;
        this.accountsService = accountsService;
        this.customersService = customersService;
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
    withPaymentSummary(sale, payments = sale.payments ?? []) {
        const totalCents = this.toCents(sale.total, 'Sale total');
        const paidCents = payments.reduce((sum, payment) => sum + this.toCents(payment.amount, 'Sale payment'), 0);
        return Object.assign(sale, {
            totalPaid: paidCents / 100,
            currentDue: Math.max(0, totalCents - paidCents) / 100,
        });
    }
    async create(createSaleDto, salespersonId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (Boolean(createSaleDto.customerId) === Boolean(createSaleDto.newCustomer)) {
                throw new common_1.BadRequestException('Provide either customerId or newCustomer, but not both');
            }
            const preparedProducts = await this.inventoryService.prepareSaleStock(createSaleDto.items, queryRunner.manager);
            let customerId;
            if (createSaleDto.newCustomer) {
                const customer = await this.customersService.createPendingInTransaction(createSaleDto.newCustomer, queryRunner.manager);
                customerId = customer.id;
            }
            else {
                if (!createSaleDto.customerId) {
                    throw new common_1.BadRequestException('Provide either customerId or newCustomer, but not both');
                }
                const customer = await queryRunner.manager.findOne(customers_entity_1.Customer, {
                    where: { id: createSaleDto.customerId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!customer)
                    throw new common_1.NotFoundException('Customer not found');
                if (!customer.isActive) {
                    throw new common_1.BadRequestException('Customer is pending until their first sale payment');
                }
                customerId = customer.id;
            }
            let subTotal = 0;
            for (const item of createSaleDto.items) {
                subTotal += item.quantity * item.unitPrice;
            }
            const total = subTotal - createSaleDto.discount + createSaleDto.vat;
            if (total < 0) {
                throw new common_1.BadRequestException('Sale total cannot be negative');
            }
            const sale = queryRunner.manager.create(sale_entity_1.Sale, {
                invoiceNumber: createSaleDto.invoiceNumber,
                customerId,
                salespersonId,
                date: createSaleDto.date,
                subTotal,
                discount: createSaleDto.discount,
                vat: createSaleDto.vat,
                total,
                status: sale_entity_1.SaleStatus.IN_PROGRESS,
            });
            const savedSale = await queryRunner.manager.save(sale);
            for (const item of createSaleDto.items) {
                const saleItem = queryRunner.manager.create(sale_item_entity_1.SaleItem, {
                    saleId: savedSale.id,
                    ...item,
                });
                await queryRunner.manager.save(saleItem);
            }
            await this.inventoryService.issueStock(savedSale.id, createSaleDto.items, queryRunner.manager, preparedProducts);
            await queryRunner.commitTransaction();
            return savedSale;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof common_1.HttpException)
                throw err;
            throw new common_1.BadRequestException(err instanceof Error ? err.message : String(err));
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll() {
        const sales = await this.salesRepository
            .createQueryBuilder('sale')
            .withDeleted()
            .leftJoinAndSelect('sale.customer', 'customer')
            .leftJoinAndSelect('sale.payments', 'payments')
            .orderBy(`CASE sale.status
          WHEN :inProgress THEN 0
          WHEN :incomplete THEN 1
          WHEN :completed THEN 2
          WHEN :returned THEN 3
          ELSE 4
        END`, 'ASC')
            .addOrderBy('sale.createdAt', 'DESC')
            .addOrderBy('sale.date', 'DESC')
            .addOrderBy('sale.invoiceNumber', 'DESC')
            .addOrderBy('sale.id', 'DESC')
            .setParameters({
            inProgress: sale_entity_1.SaleStatus.IN_PROGRESS,
            incomplete: sale_entity_1.SaleStatus.INCOMPLETE,
            completed: sale_entity_1.SaleStatus.COMPLETED,
            returned: sale_entity_1.SaleStatus.RETURNED,
        })
            .getMany();
        return sales.map((sale) => this.withPaymentSummary(sale));
    }
    async findOne(id) {
        const sale = await this.salesRepository.findOne({
            where: { id },
            relations: { customer: true },
            withDeleted: true,
        });
        if (!sale)
            throw new common_1.NotFoundException('Sale not found');
        const items = await this.itemsRepository.find({
            where: { saleId: id },
            relations: { product: true },
            withDeleted: true,
        });
        const payments = await this.paymentsRepository.find({
            where: { saleId: id },
            relations: { account: true },
            order: { createdAt: 'ASC' },
            withDeleted: true,
        });
        return { sale: this.withPaymentSummary(sale, payments), items, payments };
    }
    async addPayment(id, paymentDto, actor) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sale = await queryRunner.manager.findOne(sale_entity_1.Sale, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!sale)
                throw new common_1.NotFoundException('Sale not found');
            const isAllowedRole = actor.role === user_role_enum_1.UserRole.OWNER ||
                actor.role === user_role_enum_1.UserRole.MANAGER ||
                actor.role === user_role_enum_1.UserRole.SALESPERSON;
            const ownsSale = actor.role !== user_role_enum_1.UserRole.SALESPERSON || sale.salespersonId === actor.id;
            if (!isAllowedRole || !ownsSale) {
                throw new common_1.ForbiddenException(actor.role === user_role_enum_1.UserRole.SALESPERSON
                    ? 'Salespeople can only record payments for their own sales'
                    : 'You are not allowed to record sale payments');
            }
            const paymentMethod = (0, accounts_entity_1.normalizePaymentMethod)(paymentDto.paymentMethod);
            if (!paymentMethod) {
                throw new common_1.BadRequestException('Unsupported payment method');
            }
            if (sale.status !== sale_entity_1.SaleStatus.IN_PROGRESS &&
                sale.status !== sale_entity_1.SaleStatus.INCOMPLETE) {
                throw new common_1.BadRequestException(sale.status === sale_entity_1.SaleStatus.COMPLETED
                    ? 'Completed sale has no outstanding due'
                    : 'Cannot add payment to a returned or cancelled sale');
            }
            const amountCents = this.toCents(paymentDto.amount, 'Payment amount');
            if (amountCents <= 0) {
                throw new common_1.BadRequestException('Payment amount must be greater than zero');
            }
            const totalCents = this.toCents(sale.total, 'Sale total');
            const previousPaid = await queryRunner.manager
                .getRepository(sale_payment_entity_1.SalePayment)
                .sum('amount', { saleId: id });
            const previousPaidCents = this.toCents(previousPaid ?? 0, 'Total paid');
            const outstandingCents = Math.max(0, totalCents - previousPaidCents);
            if (outstandingCents === 0) {
                throw new common_1.BadRequestException('Completed sale has no outstanding due');
            }
            if (amountCents > outstandingCents) {
                throw new common_1.BadRequestException(`Payment exceeds the outstanding due of ${outstandingCents / 100}`);
            }
            const transactionId = paymentDto.transactionId?.trim() || null;
            if (transactionId &&
                (await queryRunner.manager.getRepository(sale_payment_entity_1.SalePayment).exists({
                    where: { saleId: id, transactionId },
                }))) {
                throw new common_1.BadRequestException('This customer payment transaction has already been recorded');
            }
            const payment = queryRunner.manager.create(sale_payment_entity_1.SalePayment, {
                ...paymentDto,
                amount: amountCents / 100,
                paymentMethod,
                transactionId,
                saleId: id,
            });
            await this.accountsService.recordInflow(queryRunner.manager, paymentDto.accountId, amountCents / 100, paymentMethod);
            const savedPayment = await queryRunner.manager.save(payment);
            const totalPaidCents = previousPaidCents + amountCents;
            sale.status =
                totalPaidCents === totalCents
                    ? sale_entity_1.SaleStatus.COMPLETED
                    : sale_entity_1.SaleStatus.INCOMPLETE;
            await queryRunner.manager.save(sale_entity_1.Sale, sale);
            const customer = await queryRunner.manager.findOne(customers_entity_1.Customer, {
                where: { id: sale.customerId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!customer)
                throw new common_1.NotFoundException('Customer not found');
            if (!customer.isActive) {
                customer.isActive = true;
                await queryRunner.manager.save(customers_entity_1.Customer, customer);
            }
            await queryRunner.commitTransaction();
            return savedPayment;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof common_1.HttpException)
                throw err;
            throw new common_1.BadRequestException(err instanceof Error ? err.message : String(err));
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(sale_item_entity_1.SaleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(sale_payment_entity_1.SalePayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService,
        accounts_service_1.AccountsService,
        customers_service_1.CustomersService,
        typeorm_2.DataSource])
], SalesService);
//# sourceMappingURL=sales.service.js.map