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
exports.SalePayment = void 0;
const typeorm_1 = require("typeorm");
const accounts_entity_1 = require("../../accounts/entities/accounts.entity");
const sale_entity_1 = require("./sale.entity");
let SalePayment = class SalePayment {
    id;
    saleId;
    sale;
    accountId;
    account;
    amount;
    paymentMethod;
    transactionId;
    date;
    createdAt;
};
exports.SalePayment = SalePayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalePayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], SalePayment.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, (sale) => sale.payments),
    (0, typeorm_1.JoinColumn)({ name: 'saleId' }),
    __metadata("design:type", sale_entity_1.Sale)
], SalePayment.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], SalePayment.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => accounts_entity_1.Account, (account) => account.salePayments),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", accounts_entity_1.Account)
], SalePayment.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], SalePayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SalePayment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", Object)
], SalePayment.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], SalePayment.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SalePayment.prototype, "createdAt", void 0);
exports.SalePayment = SalePayment = __decorate([
    (0, typeorm_1.Entity)()
], SalePayment);
//# sourceMappingURL=sale-payment.entity.js.map