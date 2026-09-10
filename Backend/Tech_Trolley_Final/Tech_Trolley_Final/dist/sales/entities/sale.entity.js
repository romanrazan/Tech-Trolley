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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = exports.SaleStatus = void 0;
const typeorm_1 = require("typeorm");
const customers_entity_1 = require("../../customers/entities/customers.entity");
const inventory_units_entity_1 = require("../../inventory/entities/inventory-units.entity");
const users_entity_1 = require("../../users/entities/users.entity");
const sale_item_entity_1 = require("./sale-item.entity");
const sale_payment_entity_1 = require("./sale-payment.entity");
var SaleStatus;
(function (SaleStatus) {
    SaleStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SaleStatus["INCOMPLETE"] = "INCOMPLETE";
    SaleStatus["COMPLETED"] = "COMPLETED";
    SaleStatus["RETURNED"] = "RETURNED";
})(SaleStatus || (exports.SaleStatus = SaleStatus = {}));
let Sale = class Sale {
    id;
    invoiceNumber;
    customerId;
    customer;
    salespersonId;
    salesperson;
    date;
    subTotal;
    discount;
    vat;
    total;
    status;
    createdAt;
    items;
    payments;
    inventoryUnits;
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Sale.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Sale.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customers_entity_1.Customer, (customer) => customer.sales),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", customers_entity_1.Customer)
], Sale.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Sale.prototype, "salespersonId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => users_entity_1.User, (user) => user.sales),
    (0, typeorm_1.JoinColumn)({ name: 'salespersonId' }),
    __metadata("design:type", users_entity_1.User)
], Sale.prototype, "salesperson", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], Sale.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "subTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "vat", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SaleStatus,
        default: SaleStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], Sale.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Sale.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_item_entity_1.SaleItem, (item) => item.sale),
    __metadata("design:type", Array)
], Sale.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_payment_entity_1.SalePayment, (payment) => payment.sale),
    __metadata("design:type", Array)
], Sale.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_units_entity_1.InventoryUnit, (unit) => unit.sale),
    __metadata("design:type", Array)
], Sale.prototype, "inventoryUnits", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)()
], Sale);
//# sourceMappingURL=sale.entity.js.map