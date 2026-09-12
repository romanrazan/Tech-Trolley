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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_entity_1 = require("../purchases/entities/purchase.entity");
const suppliers_entity_1 = require("./entities/suppliers.entity");
let SuppliersService = class SuppliersService {
    suppliersRepository;
    dataSource;
    constructor(suppliersRepository, dataSource) {
        this.suppliersRepository = suppliersRepository;
        this.dataSource = dataSource;
    }
    duplicateMessage() {
        return 'A supplier with this phone or email already exists, including archived records.';
    }
    isUniqueViolation(error) {
        if (!(error instanceof typeorm_2.QueryFailedError))
            return false;
        const driverError = error.driverError;
        return (typeof driverError === 'object' &&
            driverError !== null &&
            'code' in driverError &&
            driverError.code === '23505');
    }
    async create(createSupplierDto) {
        return this.createInTransaction(createSupplierDto);
    }
    async createInTransaction(createSupplierDto, manager) {
        return this.createWithStatus(createSupplierDto, true, manager);
    }
    async createPendingInTransaction(createSupplierDto, manager) {
        return this.createWithStatus(createSupplierDto, false, manager);
    }
    async createWithStatus(createSupplierDto, isActive, manager) {
        const repository = manager
            ? manager.getRepository(suppliers_entity_1.Supplier)
            : this.suppliersRepository;
        const existing = await repository.findOne({
            where: [
                { phone: createSupplierDto.phone },
                { email: createSupplierDto.email },
            ],
            withDeleted: true,
        });
        if (existing)
            throw new common_1.ConflictException(this.duplicateMessage());
        try {
            return await repository.save(repository.create({ ...createSupplierDto, isActive }));
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException(this.duplicateMessage());
            }
            throw error;
        }
    }
    async findAll() {
        const rows = await this.dataSource.query(`
      SELECT
        supplier.*,
        COALESCE(purchase_totals.total, 0) AS "totalPurchases",
        COALESCE(payment_totals.total, 0) AS "totalPaid",
        GREATEST(
          COALESCE(purchase_totals.total, 0) -
          COALESCE(payment_totals.total, 0),
          0
        ) AS due
      FROM supplier
      LEFT JOIN (
        SELECT "supplierId", SUM(total) AS total
        FROM purchase
        WHERE status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY "supplierId"
      ) purchase_totals ON purchase_totals."supplierId" = supplier.id
      LEFT JOIN (
        SELECT purchase."supplierId", SUM(purchase_payment.amount) AS total
        FROM purchase_payment
        INNER JOIN purchase ON purchase.id = purchase_payment."purchaseId"
        WHERE purchase.status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY purchase."supplierId"
      ) payment_totals ON payment_totals."supplierId" = supplier.id
      WHERE supplier."isActive" = true
        AND supplier."deletedAt" IS NULL
      ORDER BY supplier.name ASC
    `);
        return rows.map((row) => ({
            ...row,
            totalPurchases: Number(row.totalPurchases),
            totalPaid: Number(row.totalPaid),
            due: Number(row.due),
        }));
    }
    async findOne(id) {
        const supplier = await this.suppliersRepository.findOne({
            where: { id, isActive: true },
        });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        return supplier;
    }
    async update(id, updateSupplierDto) {
        const supplier = await this.findOne(id);
        const phone = updateSupplierDto.phone ?? supplier.phone;
        const email = updateSupplierDto.email ?? supplier.email;
        const duplicate = await this.suppliersRepository.findOne({
            where: [
                { phone, id: (0, typeorm_2.Not)(id) },
                { email, id: (0, typeorm_2.Not)(id) },
            ],
            withDeleted: true,
        });
        if (duplicate) {
            throw new common_1.ConflictException(this.duplicateMessage());
        }
        Object.assign(supplier, updateSupplierDto);
        try {
            return await this.suppliersRepository.save(supplier);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException(this.duplicateMessage());
            }
            throw error;
        }
    }
    async remove(id) {
        return this.dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(suppliers_entity_1.Supplier);
            const existingSupplier = await repository.findOne({ where: { id } });
            if (!existingSupplier)
                throw new common_1.NotFoundException('Supplier not found');
            const purchases = await manager
                .getRepository(purchase_entity_1.Purchase)
                .createQueryBuilder('purchase')
                .setLock('pessimistic_write')
                .where('purchase.supplierId = :id', { id })
                .andWhere('purchase.status IN (:...statuses)', {
                statuses: [
                    purchase_entity_1.PurchaseStatus.IN_PROGRESS,
                    purchase_entity_1.PurchaseStatus.INCOMPLETE,
                    purchase_entity_1.PurchaseStatus.COMPLETED,
                ],
            })
                .getMany();
            const supplier = await repository.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!supplier)
                throw new common_1.NotFoundException('Supplier not found');
            const [dueRow] = await manager.query(`
          SELECT COALESCE(SUM(GREATEST(purchase.total - COALESCE(payments.paid, 0), 0)), 0) AS due
          FROM purchase
          LEFT JOIN (
            SELECT "purchaseId", SUM(amount) AS paid
            FROM purchase_payment
            GROUP BY "purchaseId"
          ) payments ON payments."purchaseId" = purchase.id
          WHERE purchase."supplierId" = $1
            AND purchase.status IN ('INCOMPLETE', 'COMPLETED')
        `, [id]);
            const due = Number(dueRow?.due ?? 0);
            if (due > 0) {
                throw new common_1.ConflictException(`This supplier cannot be deleted because ${due.toFixed(2)} is still due.`);
            }
            if (purchases.some((purchase) => purchase.status === purchase_entity_1.PurchaseStatus.IN_PROGRESS ||
                purchase.status === purchase_entity_1.PurchaseStatus.INCOMPLETE)) {
                throw new common_1.ConflictException('This supplier has an active incomplete purchase.');
            }
            await repository.softRemove(supplier);
            return { message: 'Supplier deleted successfully.' };
        });
    }
    async getDues(id) {
        await this.findOne(id);
        const rows = await this.dataSource.query(`
        SELECT GREATEST(
          COALESCE(SUM(purchase.total), 0) -
          COALESCE(SUM(payment_totals.total), 0),
          0
        ) AS due
        FROM purchase
        LEFT JOIN (
          SELECT "purchaseId", SUM(amount) AS total
          FROM purchase_payment
          GROUP BY "purchaseId"
        ) payment_totals ON payment_totals."purchaseId" = purchase.id
        WHERE purchase."supplierId" = $1
          AND purchase.status IN ('INCOMPLETE', 'COMPLETED')
      `, [id]);
        return { due: Number(rows[0]?.due ?? 0) };
    }
    async getDetails(id) {
        const supplier = await this.findOne(id);
        const purchases = await this.dataSource.getRepository(purchase_entity_1.Purchase).find({
            where: {
                supplierId: id,
                status: (0, typeorm_2.In)([purchase_entity_1.PurchaseStatus.INCOMPLETE, purchase_entity_1.PurchaseStatus.COMPLETED]),
            },
            relations: {
                items: { product: true },
                payments: true,
            },
            withDeleted: true,
            order: { date: 'DESC', createdAt: 'DESC' },
        });
        const history = purchases
            .filter((purchase) => purchase.status === purchase_entity_1.PurchaseStatus.INCOMPLETE ||
            purchase.status === purchase_entity_1.PurchaseStatus.COMPLETED)
            .map((purchase) => {
            const paidCents = (purchase.payments ?? []).reduce((sum, payment) => sum + Math.round(Number(payment.amount) * 100), 0);
            const totalCents = Math.round(Number(purchase.total) * 100);
            return {
                id: purchase.id,
                date: purchase.date,
                invoiceNumber: purchase.invoiceNumber,
                status: purchase.status,
                total: totalCents / 100,
                paidAmount: paidCents / 100,
                remainingDue: Math.max(0, totalCents - paidCents) / 100,
                remarks: purchase.remarks ?? null,
                items: (purchase.items ?? []).map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product?.name ?? 'Unknown product',
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    imeis: item.imeis ?? [],
                })),
                payments: (purchase.payments ?? []).map((payment) => ({
                    id: payment.id,
                    amount: Number(payment.amount),
                    paymentMethod: payment.paymentMethod,
                    transactionId: payment.transactionId ?? null,
                    date: payment.date,
                })),
            };
        });
        return {
            supplier,
            summary: {
                totalPurchases: history.reduce((sum, purchase) => sum + Math.round(purchase.total * 100), 0) / 100,
                totalPaid: history.reduce((sum, purchase) => sum + Math.round(purchase.paidAmount * 100), 0) / 100,
                totalDue: history.reduce((sum, purchase) => sum + Math.round(purchase.remainingDue * 100), 0) / 100,
            },
            purchases: history,
        };
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(suppliers_entity_1.Supplier)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map