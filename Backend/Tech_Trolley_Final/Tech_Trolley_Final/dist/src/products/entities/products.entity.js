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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const brands_entity_1 = require("../../brands/entities/brands.entity");
const categories_entity_1 = require("../../categories/entities/categories.entity");
let Product = class Product {
    id;
    name;
    brandId;
    brand;
    categoryId;
    category;
    trackingType;
    quantity;
    isActive;
    deletedAt;
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "brandId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => brands_entity_1.Brand, (brand) => brand.products),
    (0, typeorm_1.JoinColumn)({ name: 'brandId' }),
    __metadata("design:type", brands_entity_1.Brand)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categories_entity_1.Category, (category) => category.products),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", categories_entity_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['SERIALIZED', 'QUANTITY'],
    }),
    __metadata("design:type", String)
], Product.prototype, "trackingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "deletedAt", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Check)('CHK_product_quantity_non_negative', '"quantity" >= 0'),
    (0, typeorm_1.Index)('IDX_product_active_name', ['name'], {
        where: '"deletedAt" IS NULL',
    })
], Product);
//# sourceMappingURL=products.entity.js.map