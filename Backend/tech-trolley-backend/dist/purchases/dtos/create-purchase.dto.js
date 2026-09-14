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
exports.CreatePurchaseDto = exports.PurchaseItemDto = exports.NewPurchaseProductDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const create_supplier_dto_1 = require("../../suppliers/dtos/create-supplier.dto");
const create_product_dto_1 = require("../../products/dtos/create-product.dto");
let ExactlyOneSupplierSelection = class ExactlyOneSupplierSelection {
    validate(_value, args) {
        const dto = args.object;
        return Boolean(dto.supplierId) !== Boolean(dto.newSupplier);
    }
    defaultMessage() {
        return 'Provide either supplierId or newSupplier, but not both';
    }
};
ExactlyOneSupplierSelection = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'exactlyOneSupplierSelection', async: false })
], ExactlyOneSupplierSelection);
class NewPurchaseProductDto {
    name;
    brandId;
    categoryId;
    trackingType;
    isActive;
}
exports.NewPurchaseProductDto = NewPurchaseProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Samsung Galaxy S25' }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)({ message: 'Product name is required.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Product name is required.' }),
    __metadata("design:type", String)
], NewPurchaseProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'brand-uuid' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Select a valid brand.' }),
    __metadata("design:type", String)
], NewPurchaseProductDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'category-uuid' }),
    (0, class_validator_1.IsUUID)('4', { message: 'Select a valid category.' }),
    __metadata("design:type", String)
], NewPurchaseProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: create_product_dto_1.TrackingType }),
    (0, class_validator_1.IsEnum)(create_product_dto_1.TrackingType, { message: 'Select a valid tracking type.' }),
    __metadata("design:type", String)
], NewPurchaseProductDto.prototype, "trackingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NewPurchaseProductDto.prototype, "isActive", void 0);
let ExactlyOneProductSelection = class ExactlyOneProductSelection {
    validate(_value, args) {
        const dto = args.object;
        return Boolean(dto.productId) !== Boolean(dto.newProduct);
    }
    defaultMessage() {
        return 'Provide either productId or newProduct, but not both';
    }
};
ExactlyOneProductSelection = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'exactlyOneProductSelection', async: false })
], ExactlyOneProductSelection);
class PurchaseItemDto {
    productId;
    newProduct;
    productSelection;
    quantity;
    unitPrice;
    imeis;
}
exports.PurchaseItemDto = PurchaseItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'product-uuid' }),
    (0, class_transformer_1.Transform)(({ value }) => value === '' ? undefined : value),
    (0, class_validator_1.ValidateIf)((dto) => dto.productId !== undefined),
    (0, class_validator_1.IsUUID)('4', { message: 'Select a valid product.' }),
    __metadata("design:type", String)
], PurchaseItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: NewPurchaseProductDto }),
    (0, class_validator_1.ValidateIf)((dto) => dto.newProduct !== undefined),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NewPurchaseProductDto),
    __metadata("design:type", NewPurchaseProductDto)
], PurchaseItemDto.prototype, "newProduct", void 0);
__decorate([
    (0, swagger_1.ApiHideProperty)(),
    (0, class_validator_1.Validate)(ExactlyOneProductSelection),
    __metadata("design:type", void 0)
], PurchaseItemDto.prototype, "productSelection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsInt)({ message: 'Quantity must be a whole number.' }),
    (0, class_validator_1.Min)(1, { message: 'Quantity must be at least 1.' }),
    __metadata("design:type", Number)
], PurchaseItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 85000 }),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Unit price must be a valid number with at most 2 decimals.' }),
    (0, class_validator_1.IsPositive)({ message: 'Unit price must be greater than 0.' }),
    __metadata("design:type", Number)
], PurchaseItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['IMEI12345', 'IMEI67890'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => Array.isArray(value)
        ? value.map((imei) => typeof imei === 'string' ? imei.trim() : imei)
        : value),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], PurchaseItemDto.prototype, "imeis", void 0);
class CreatePurchaseDto {
    invoiceNumber;
    supplierId;
    newSupplier;
    supplierSelection;
    date;
    items;
    remarks;
}
exports.CreatePurchaseDto = CreatePurchaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INV-2023-001' }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)({ message: 'Invoice number is required.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Invoice number is required.' }),
    __metadata("design:type", String)
], CreatePurchaseDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'supplier-uuid' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.supplierId !== undefined),
    (0, class_validator_1.IsUUID)('4', { message: 'Select a valid supplier.' }),
    __metadata("design:type", String)
], CreatePurchaseDto.prototype, "supplierId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: create_supplier_dto_1.CreateSupplierDto }),
    (0, class_validator_1.ValidateIf)((dto) => dto.newSupplier !== undefined),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_supplier_dto_1.CreateSupplierDto),
    __metadata("design:type", create_supplier_dto_1.CreateSupplierDto)
], CreatePurchaseDto.prototype, "newSupplier", void 0);
__decorate([
    (0, swagger_1.ApiHideProperty)(),
    (0, class_validator_1.Validate)(ExactlyOneSupplierSelection),
    __metadata("design:type", void 0)
], CreatePurchaseDto.prototype, "supplierSelection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-10-25' }),
    (0, class_validator_1.IsString)({ message: 'Use a valid date.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Use a valid date.' }),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use a valid date.' }),
    __metadata("design:type", String)
], CreatePurchaseDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PurchaseItemDto] }),
    (0, class_validator_1.IsArray)({ message: 'Add at least one item.' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Add at least one item.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseItemDto),
    __metadata("design:type", Array)
], CreatePurchaseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'First batch of S25' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchaseDto.prototype, "remarks", void 0);
//# sourceMappingURL=create-purchase.dto.js.map