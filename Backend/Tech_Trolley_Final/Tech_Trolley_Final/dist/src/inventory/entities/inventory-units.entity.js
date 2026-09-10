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
exports.InventoryUnit = exports.InventoryStatus = void 0;
const typeorm_1 = require("typeorm");
const products_entity_1 = require("../../products/entities/products.entity");
const purchase_entity_1 = require("../../purchases/entities/purchase.entity");
const sale_entity_1 = require("../../sales/entities/sale.entity");
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "IN_STOCK";
    InventoryStatus["SOLD"] = "SOLD";
    InventoryStatus["DAMAGED"] = "DAMAGED";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
let InventoryUnit = class InventoryUnit {
    id;
    productId;
    product;
    imei;
    quantity;
    status;
    purchaseId;
    purchase;
    saleId;
    sale;
};
exports.InventoryUnit = InventoryUnit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryUnit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], InventoryUnit.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => products_entity_1.Product),
    (0, typeorm_1.JoinColumn)({
        name: 'productId',
        foreignKeyConstraintName: 'FK_inventory_unit_product',
    }),
    __metadata("design:type", products_entity_1.Product)
], InventoryUnit.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], InventoryUnit.prototype, "imei", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], InventoryUnit.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryStatus,
        default: InventoryStatus.IN_STOCK,
    }),
    __metadata("design:type", String)
], InventoryUnit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", Object)
], InventoryUnit.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_entity_1.Purchase, (purchase) => purchase.inventoryUnits, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'purchaseId' }),
    __metadata("design:type", purchase_entity_1.Purchase)
], InventoryUnit.prototype, "purchase", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { nullable: true }),
    __metadata("design:type", Object)
], InventoryUnit.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, (sale) => sale.inventoryUnits, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'saleId' }),
    __metadata("design:type", sale_entity_1.Sale)
], InventoryUnit.prototype, "sale", void 0);
exports.InventoryUnit = InventoryUnit = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)('IDX_inventory_unit_productId', ['productId']),
    (0, typeorm_1.Index)('IDX_inventory_unit_imei_unique', ['imei'], {
        unique: true,
        where: '"imei" IS NOT NULL',
    })
], InventoryUnit);
//# sourceMappingURL=inventory-units.entity.js.map