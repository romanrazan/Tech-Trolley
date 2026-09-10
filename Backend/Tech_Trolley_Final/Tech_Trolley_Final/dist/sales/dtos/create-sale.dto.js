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
exports.CreateSaleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const create_customer_dto_1 = require("../../customers/dtos/create-customer.dto");
let ExactlyOneCustomerSelection = class ExactlyOneCustomerSelection {
    validate(_value, args) {
        const dto = args.object;
        return Boolean(dto.customerId) !== Boolean(dto.newCustomer);
    }
    defaultMessage() {
        return 'Provide either customerId or newCustomer, but not both';
    }
};
ExactlyOneCustomerSelection = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'exactlyOneCustomerSelection', async: false })
], ExactlyOneCustomerSelection);
class SaleItemDto {
    productId;
    quantity;
    unitPrice;
    imeis;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'product-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaleItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 92000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['IMEI12345'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], SaleItemDto.prototype, "imeis", void 0);
class CreateSaleDto {
    invoiceNumber;
    customerId;
    newCustomer;
    customerSelection;
    date;
    discount;
    vat;
    items;
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INV-S-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'customer-uuid' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.customerId !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: create_customer_dto_1.CreateCustomerDto }),
    (0, class_validator_1.ValidateIf)((dto) => dto.newCustomer !== undefined),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => create_customer_dto_1.CreateCustomerDto),
    __metadata("design:type", create_customer_dto_1.CreateCustomerDto)
], CreateSaleDto.prototype, "newCustomer", void 0);
__decorate([
    (0, swagger_1.ApiHideProperty)(),
    (0, class_validator_1.Validate)(ExactlyOneCustomerSelection),
    __metadata("design:type", void 0)
], CreateSaleDto.prototype, "customerSelection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-10-26' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "discount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "vat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SaleItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaleItemDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
//# sourceMappingURL=create-sale.dto.js.map