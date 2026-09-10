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
exports.PurchasePayment = void 0;
const typeorm_1 = require("typeorm");
const accounts_entity_1 = require("../../accounts/entities/accounts.entity");
const purchase_entity_1 = require("./purchase.entity");
let PurchasePayment = class PurchasePayment {
    id;
    purchaseId;
    purchase;
    accountId;
    account;
    amount;
    paymentMethod;
    transactionId;
    date;
    createdAt;
};
exports.PurchasePayment = PurchasePayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PurchasePayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PurchasePayment.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_entity_1.Purchase, (purchase) => purchase.payments),
    (0, typeorm_1.JoinColumn)({ name: 'purchaseId' }),
    __metadata("design:type", purchase_entity_1.Purchase)
], PurchasePayment.prototype, "purchase", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PurchasePayment.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => accounts_entity_1.Account, (account) => account.purchasePayments),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", accounts_entity_1.Account)
], PurchasePayment.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PurchasePayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PurchasePayment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { nullable: true }),
    __metadata("design:type", Object)
], PurchasePayment.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], PurchasePayment.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PurchasePayment.prototype, "createdAt", void 0);
exports.PurchasePayment = PurchasePayment = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)('UQ_purchase_payment_transaction', ['purchaseId', 'transactionId'], {
        unique: true,
        where: '"transactionId" IS NOT NULL',
    })
], PurchasePayment);
//# sourceMappingURL=purchase-payment.entity.js.map