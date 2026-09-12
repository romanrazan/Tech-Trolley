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
exports.Account = exports.PAYMENT_METHODS = void 0;
exports.normalizePaymentMethod = normalizePaymentMethod;
exports.isAccountTypeCompatible = isAccountTypeCompatible;
const typeorm_1 = require("typeorm");
const expenses_entity_1 = require("../../expenses/entities/expenses.entity");
const purchase_payment_entity_1 = require("../../purchases/entities/purchase-payment.entity");
const sale_payment_entity_1 = require("../../sales/entities/sale-payment.entity");
exports.PAYMENT_METHODS = [
    'Cash',
    'Bank Transfer',
    'Mobile Wallet',
];
const ACCOUNT_TYPES_BY_METHOD = {
    Cash: ['cash'],
    'Bank Transfer': ['bank', 'bank account'],
    'Mobile Wallet': [
        'mobile wallet',
        'mobile banking',
        'mobile banking account',
        'wallet',
    ],
};
function normalize(value) {
    return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}
function normalizePaymentMethod(value) {
    const normalized = normalize(value);
    return (exports.PAYMENT_METHODS.find((method) => normalize(method) === normalized) ?? null);
}
function isAccountTypeCompatible(paymentMethod, accountType) {
    return ACCOUNT_TYPES_BY_METHOD[paymentMethod].includes(normalize(accountType));
}
let Account = class Account {
    id;
    name;
    type;
    accountNumber;
    balance;
    isActive;
    deletedAt;
    expenses;
    purchasePayments;
    salePayments;
};
exports.Account = Account;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Account.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Account.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Account.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Account.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Account.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => expenses_entity_1.Expense, (expense) => expense.account),
    __metadata("design:type", Array)
], Account.prototype, "expenses", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_payment_entity_1.PurchasePayment, (payment) => payment.account),
    __metadata("design:type", Array)
], Account.prototype, "purchasePayments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sale_payment_entity_1.SalePayment, (payment) => payment.account),
    __metadata("design:type", Array)
], Account.prototype, "salePayments", void 0);
exports.Account = Account = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)('IDX_account_active_name', ['name'], {
        where: '"deletedAt" IS NULL',
    })
], Account);
//# sourceMappingURL=accounts.entity.js.map