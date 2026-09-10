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
exports.SaleItem = void 0;
const typeorm_1 = require("typeorm");
const products_entity_1 = require("../../products/entities/products.entity");
const sale_entity_1 = require("./sale.entity");
let SaleItem = class SaleItem {
    id;
    saleId;
    sale;
    productId;
    product;
    quantity;
    unitPrice;
    imeis;
};
exports.SaleItem = SaleItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SaleItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], SaleItem.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sale_entity_1.Sale, (sale) => sale.items),
    (0, typeorm_1.JoinColumn)({ name: 'saleId' }),
    __metadata("design:type", sale_entity_1.Sale)
], SaleItem.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], SaleItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => products_entity_1.Product),
    (0, typeorm_1.JoinColumn)({
        name: 'productId',
        foreignKeyConstraintName: 'FK_sale_item_product',
    }),
    __metadata("design:type", products_entity_1.Product)
], SaleItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SaleItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], SaleItem.prototype, "imeis", void 0);
exports.SaleItem = SaleItem = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)('IDX_sale_item_productId', ['productId'])
], SaleItem);
//# sourceMappingURL=sale-item.entity.js.map