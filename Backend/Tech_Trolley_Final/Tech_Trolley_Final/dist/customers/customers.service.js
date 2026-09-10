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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("../sales/entities/sale.entity");
const customers_entity_1 = require("./entities/customers.entity");
let CustomersService = class CustomersService {
    customersRepository;
    dataSource;
    constructor(customersRepository, dataSource) {
        this.customersRepository = customersRepository;
        this.dataSource = dataSource;
    }
    duplicatePhoneMessage() {
        return 'A customer with this phone already exists, including archived records.';
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
    async create(createCustomerDto) {
        return this.createInTransaction(createCustomerDto);
    }
    async createInTransaction(createCustomerDto, manager) {
        return this.createWithStatus(createCustomerDto, true, manager);
    }
    async createPendingInTransaction(createCustomerDto, manager) {
        return this.createWithStatus(createCustomerDto, false, manager);
    }
    async createWithStatus(createCustomerDto, isActive, manager) {
        const repository = manager
            ? manager.getRepository(customers_entity_1.Customer)
            : this.customersRepository;
        const existing = await repository.findOne({
            where: { phone: createCustomerDto.phone },
            withDeleted: true,
        });
        if (existing)
            throw new common_1.ConflictException(this.duplicatePhoneMessage());
        try {
            const customer = repository.create({ ...createCustomerDto, isActive });
            return await repository.save(customer);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException(this.duplicatePhoneMessage());
            }
            throw error;
        }
    }
    async findAll() {
        const rows = await this.dataSource.query(`
      SELECT
        customer.*,
        COALESCE(sale_totals.total, 0) AS "totalSales",
        COALESCE(payment_totals.total, 0) AS "totalPaid",
        GREATEST(
          COALESCE(sale_totals.total, 0) -
          COALESCE(payment_totals.total, 0),
          0
        ) AS due
      FROM customer
      LEFT JOIN (
        SELECT "customerId", SUM(total) AS total
        FROM sale
        WHERE status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY "customerId"
      ) sale_totals ON sale_totals."customerId" = customer.id
      LEFT JOIN (
        SELECT sale."customerId", SUM(sale_payment.amount) AS total
        FROM sale_payment
        INNER JOIN sale ON sale.id = sale_payment."saleId"
        WHERE sale.status IN ('INCOMPLETE', 'COMPLETED')
        GROUP BY sale."customerId"
      ) payment_totals ON payment_totals."customerId" = customer.id
      WHERE customer."isActive" = true
        AND customer."deletedAt" IS NULL
      ORDER BY customer.name ASC
    `);
        return rows.map((row) => ({
            ...row,
            totalSales: Number(row.totalSales),
            totalPaid: Number(row.totalPaid),
            due: Number(row.due),
        }));
    }
    async findOne(id) {
        const customer = await this.customersRepository.findOne({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async update(id, updateCustomerDto) {
        const customer = await this.findOne(id);
        if (updateCustomerDto.phone !== customer.phone) {
            const existing = await this.customersRepository.findOne({
                where: { phone: updateCustomerDto.phone },
                withDeleted: true,
            });
            if (existing)
                throw new common_1.ConflictException(this.duplicatePhoneMessage());
        }
        Object.assign(customer, updateCustomerDto);
        try {
            return await this.customersRepository.save(customer);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException(this.duplicatePhoneMessage());
            }
            throw error;
        }
    }
    async remove(id) {
        return this.dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(customers_entity_1.Customer);
            const existingCustomer = await repository.findOne({ where: { id } });
            if (!existingCustomer)
                throw new common_1.NotFoundException('Customer not found');
            const sales = await manager
                .getRepository(sale_entity_1.Sale)
                .createQueryBuilder('sale')
                .setLock('pessimistic_write')
                .where('sale.customerId = :id', { id })
                .andWhere('sale.status IN (:...statuses)', {
                statuses: [
                    sale_entity_1.SaleStatus.IN_PROGRESS,
                    sale_entity_1.SaleStatus.INCOMPLETE,
                    sale_entity_1.SaleStatus.COMPLETED,
                ],
            })
                .getMany();
            const customer = await repository.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!customer)
                throw new common_1.NotFoundException('Customer not found');
            const [dueRow] = await manager.query(`
          SELECT COALESCE(SUM(GREATEST(sale.total - COALESCE(payments.paid, 0), 0)), 0) AS due
          FROM sale
          LEFT JOIN (
            SELECT "saleId", SUM(amount) AS paid
            FROM sale_payment
            GROUP BY "saleId"
          ) payments ON payments."saleId" = sale.id
          WHERE sale."customerId" = $1
            AND sale.status IN ('INCOMPLETE', 'COMPLETED')
        `, [id]);
            const due = Number(dueRow?.due ?? 0);
            if (due > 0) {
                throw new common_1.ConflictException(`This customer cannot be deleted because ${due.toFixed(2)} is still due.`);
            }
            if (sales.some((sale) => sale.status === sale_entity_1.SaleStatus.IN_PROGRESS ||
                sale.status === sale_entity_1.SaleStatus.INCOMPLETE)) {
                throw new common_1.ConflictException('This customer has an active incomplete sale.');
            }
            await repository.softRemove(customer);
            return { message: 'Customer deleted successfully.' };
        });
    }
    async getDues(id) {
        await this.findOne(id);
        const rows = await this.dataSource.query(`
        SELECT GREATEST(
          COALESCE(SUM(sale.total), 0) -
          COALESCE(SUM(payment_totals.total), 0),
          0
        ) AS due
        FROM sale
        LEFT JOIN (
          SELECT "saleId", SUM(amount) AS total
          FROM sale_payment
          GROUP BY "saleId"
        ) payment_totals ON payment_totals."saleId" = sale.id
        WHERE sale."customerId" = $1
          AND sale.status IN ('INCOMPLETE', 'COMPLETED')
      `, [id]);
        return { due: Number(rows[0]?.due ?? 0) };
    }
    async getDetails(id) {
        const customer = await this.findOne(id);
        const sales = await this.dataSource.getRepository(sale_entity_1.Sale).find({
            where: {
                customerId: id,
                status: (0, typeorm_2.Not)(sale_entity_1.SaleStatus.IN_PROGRESS),
            },
            relations: {
                items: { product: true },
                payments: true,
            },
            withDeleted: true,
            order: { date: 'DESC', createdAt: 'DESC' },
        });
        const history = sales
            .filter((sale) => sale.status !== sale_entity_1.SaleStatus.IN_PROGRESS)
            .map((sale) => {
            const paidCents = (sale.payments ?? []).reduce((sum, payment) => sum + Math.round(Number(payment.amount) * 100), 0);
            const totalCents = Math.round(Number(sale.total) * 100);
            const returned = sale.status === sale_entity_1.SaleStatus.RETURNED;
            return {
                id: sale.id,
                date: sale.date,
                invoiceNumber: sale.invoiceNumber,
                status: sale.status,
                total: totalCents / 100,
                paidAmount: paidCents / 100,
                remainingDue: returned
                    ? 0
                    : Math.max(0, totalCents - paidCents) / 100,
                items: (sale.items ?? []).map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product?.name ?? 'Unknown product',
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    imeis: item.imeis ?? [],
                })),
            };
        });
        const activeSales = history.filter((sale) => sale.status === sale_entity_1.SaleStatus.INCOMPLETE ||
            sale.status === sale_entity_1.SaleStatus.COMPLETED);
        return {
            customer,
            summary: {
                totalSales: activeSales.reduce((sum, sale) => sum + Math.round(sale.total * 100), 0) / 100,
                totalPaid: activeSales.reduce((sum, sale) => sum + Math.round(sale.paidAmount * 100), 0) / 100,
                totalDue: activeSales.reduce((sum, sale) => sum + Math.round(sale.remainingDue * 100), 0) / 100,
            },
            sales: history,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customers_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], CustomersService);
//# sourceMappingURL=customers.service.js.map