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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let ReportsService = class ReportsService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getDashboardStats() {
        const [salesResult] = await this.dataSource.query(`SELECT COALESCE(SUM(total), 0) as "totalSales" FROM sale WHERE status = 'COMPLETED'`);
        const [purchasesResult] = await this.dataSource.query(`SELECT COALESCE(SUM(total), 0) as "totalPurchases"
       FROM purchase
       WHERE status <> 'CANCELLED'`);
        const [expensesResult] = await this.dataSource.query(`SELECT COALESCE(SUM(amount), 0) as "totalExpenses" FROM expense`);
        const [customersResult] = await this.dataSource.query(`SELECT COUNT(*) as "totalCustomers"
       FROM customer
       WHERE "isActive" = true AND "deletedAt" IS NULL`);
        const [productsResult] = await this.dataSource.query(`SELECT COUNT(*) as "totalProducts" FROM product WHERE "deletedAt" IS NULL`);
        return {
            totalSales: Number(salesResult.totalSales),
            totalPurchases: Number(purchasesResult.totalPurchases),
            totalExpenses: Number(expensesResult.totalExpenses),
            totalCustomers: Number(customersResult.totalCustomers),
            totalProducts: Number(productsResult.totalProducts),
        };
    }
    async getSalesChartData() {
        const result = await this.dataSource.query(`
      SELECT date, SUM(total) as total
      FROM sale
      WHERE status = 'COMPLETED'
      GROUP BY date
      ORDER BY date ASC
      LIMIT 30
    `);
        return result;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map