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
exports.CreateProductDto = exports.TrackingType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TrackingType;
(function (TrackingType) {
    TrackingType["SERIALIZED"] = "SERIALIZED";
    TrackingType["QUANTITY"] = "QUANTITY";
})(TrackingType || (exports.TrackingType = TrackingType = {}));
let SerializedOpeningQuantity = class SerializedOpeningQuantity {
    validate(quantity, args) {
        const dto = args.object;
        return dto.trackingType !== TrackingType.SERIALIZED || quantity === 0;
    }
    defaultMessage() {
        return 'Serialized products must start with quantity 0; add stock through Purchase with IMEIs';
    }
};
SerializedOpeningQuantity = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'serializedOpeningQuantity', async: false })
], SerializedOpeningQuantity);
class CreateProductDto {
    name;
    brandId;
    categoryId;
    trackingType;
    quantity;
    isActive;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Samsung Galaxy S25' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'brand-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'category-uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TrackingType, example: TrackingType.SERIALIZED }),
    (0, class_validator_1.IsEnum)(TrackingType),
    __metadata("design:type", String)
], CreateProductDto.prototype, "trackingType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, minimum: 0, type: Number }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Validate)(SerializedOpeningQuantity),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-product.dto.js.map