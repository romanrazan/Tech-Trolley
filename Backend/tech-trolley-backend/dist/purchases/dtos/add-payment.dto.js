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
exports.AddPurchasePaymentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const accounts_entity_1 = require("../../accounts/entities/accounts.entity");
class AddPurchasePaymentDto {
    amount;
    paymentMethod;
    accountId;
    transactionId;
    date;
}
exports.AddPurchasePaymentDto = AddPurchasePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 50000,
        description: 'Payment amount paid to the supplier. Must be positive.',
    }),
    (0, class_validator_1.IsNumber)({
        allowNaN: false,
        allowInfinity: false,
        maxDecimalPlaces: 2,
    }),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], AddPurchasePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Bank Transfer',
        description: 'How the payment was made (e.g. Cash, Bank Transfer).',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(accounts_entity_1.PAYMENT_METHODS),
    __metadata("design:type", String)
], AddPurchasePaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a3f1c2d4-5678-4abc-9def-0123456789ab',
        description: 'UUID of the financial account this money is paid FROM (outflow). ' +
            'The account balance is decreased by the payment amount, atomically ' +
            'with the payment record.',
        format: 'uuid',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddPurchasePaymentDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'TXN987654321',
        description: 'Optional external transaction reference.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddPurchasePaymentDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-07-26',
        description: 'Payment date (YYYY-MM-DD).',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPurchasePaymentDto.prototype, "date", void 0);
//# sourceMappingURL=add-payment.dto.js.map