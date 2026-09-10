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
exports.Purchase = exports.PurchaseStatus = void 0;
const typeorm_1 = require("typeorm");
const inventory_units_entity_1 = require("../../inventory/entities/inventory-units.entity");
const suppliers_entity_1 = require("../../suppliers/entities/suppliers.entity");
const purchase_item_entity_1 = require("./purchase-item.entity");
const purchase_payment_entity_1 = require("./purchase-payment.entity");
var PurchaseStatus;
(function (PurchaseStatus) {
    PurchaseStatus["IN_PROGRESS"] = "IN_PROGRESS";
    PurchaseStatus["INCOMPLETE"] = "INCOMPLETE";
    PurchaseStatus["COMPLETED"] = "COMPLETED";
    PurchaseStatus["CANCELLED"] = "CANCELLED";
})(PurchaseStatus || (exports.PurchaseStatus = PurchaseStatus = {}));
let Purchase = class Purchase {
    id;
    invoiceNumber;
    supplierId;
    supplier;
    date;
    total;
    status;
    remarks;
    createdAt;
    items;
    payments;
    inventoryUnits;
};
exports.Purchase = Purchase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Purchase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Purchase.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Purchase.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => suppliers_entity_1.Supplier, (supplier) => supplier.purchases),
    (0, typeorm_1.JoinColumn)({ name: 'supplierId' }),
    __metadata("design:type", suppliers_entity_1.Supplier)
], Purchase.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", String)
], Purchase.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Purchase.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PurchaseStatus,
        default: PurchaseStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], Purchase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Purchase.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Purchase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_item_entity_1.PurchaseItem, (item) => item.purchase),
    __metadata("design:type", Array)
], Purchase.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_payment_entity_1.PurchasePayment, (payment) => payment.purchase),
    __metadata("design:type", Array)
], Purchase.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_units_entity_1.InventoryUnit, (unit) => unit.purchase),
    __metadata("design:type", Array)
], Purchase.prototype, "inventoryUnits", void 0);
exports.Purchase = Purchase = __decorate([
    (0, typeorm_1.Entity)()
], Purchase);
//# sourceMappingURL=purchase.entity.js.map