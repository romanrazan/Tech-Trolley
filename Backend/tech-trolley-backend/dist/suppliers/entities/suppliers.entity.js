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
exports.Supplier = void 0;
const typeorm_1 = require("typeorm");
const purchase_entity_1 = require("../../purchases/entities/purchase.entity");
let Supplier = class Supplier {
    id;
    name;
    phone;
    email;
    address;
    isActive;
    deletedAt;
    purchases;
};
exports.Supplier = Supplier;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Supplier.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Supplier.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Supplier.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Supplier.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Supplier.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Supplier.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Supplier.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => purchase_entity_1.Purchase, (purchase) => purchase.supplier),
    __metadata("design:type", Array)
], Supplier.prototype, "purchases", void 0);
exports.Supplier = Supplier = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)('UQ_supplier_phone', ['phone'], { unique: true }),
    (0, typeorm_1.Index)('UQ_supplier_email', ['email'], { unique: true }),
    (0, typeorm_1.Index)('IDX_supplier_active_name', ['name'], {
        where: '"deletedAt" IS NULL',
    })
], Supplier);
//# sourceMappingURL=suppliers.entity.js.map