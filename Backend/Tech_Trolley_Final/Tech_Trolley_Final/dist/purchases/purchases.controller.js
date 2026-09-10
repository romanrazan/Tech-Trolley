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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesController = void 0;
const common_1 = require("@nestjs/common");
const purchases_service_1 = require("./purchases.service");
const create_purchase_dto_1 = require("./dtos/create-purchase.dto");
const add_payment_dto_1 = require("./dtos/add-payment.dto");
const jwtGuard_1 = require("../auth/jwtGuard");
const roles_guard_1 = require("../auth/roles/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_role_enum_1 = require("../auth/user-role.enum");
const swagger_1 = require("@nestjs/swagger");
let PurchasesController = class PurchasesController {
    purchasesService;
    constructor(purchasesService) {
        this.purchasesService = purchasesService;
    }
    create(createPurchaseDto) {
        return this.purchasesService.create(createPurchaseDto);
    }
    findAll() {
        return this.purchasesService.findAll();
    }
    findOne(id) {
        return this.purchasesService.findOne(id);
    }
    addPayment(id, paymentDto) {
        return this.purchasesService.addPayment(id, paymentDto);
    }
};
exports.PurchasesController = PurchasesController;
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a purchase',
        description: 'Creates an IN_PROGRESS purchase, records the purchase items, and receives ' +
            'stock into inventory in a single transaction. The total is computed by ' +
            'the server from the line items.',
    }),
    (0, swagger_1.ApiBody)({ type: create_purchase_dto_1.CreatePurchaseDto }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Purchase created and stock received.' }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'Validation error.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid token.' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Insufficient role.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_dto_1.CreatePurchaseDto]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all purchases' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Array of purchases.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a purchase with its items and payments' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Purchase UUID', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Purchase, its items, and its payments.' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Purchase not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Post)(':id/payments'),
    (0, swagger_1.ApiOperation)({
        summary: 'Record a purchase payment (supplier outflow)',
        description: 'Records a payment to the supplier against the purchase AND debits the ' +
            'chosen financial account (outflow) in a single database transaction. ' +
            'If the account is missing or inactive, nothing is saved (full ' +
            'rollback). The same transaction activates a pending supplier and updates ' +
            'the purchase status from persisted payment totals.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Purchase UUID to pay against',
        format: 'uuid',
    }),
    (0, swagger_1.ApiBody)({
        type: add_payment_dto_1.AddPurchasePaymentDto,
        examples: {
            bank: {
                summary: 'Bank transfer payment',
                value: {
                    amount: 50000,
                    paymentMethod: 'Bank Transfer',
                    accountId: 'a3f1c2d4-5678-4abc-9def-0123456789ab',
                    transactionId: 'TXN987654321',
                    date: '2026-07-26',
                },
            },
        },
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Payment recorded and account balance decreased.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation error, purchase completed/cancelled, overpayment, or the ' +
            'financial account is missing/inactive (transaction rolled back).',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid token.' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Insufficient role.' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Purchase not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_payment_dto_1.AddPurchasePaymentDto]),
    __metadata("design:returntype", void 0)
], PurchasesController.prototype, "addPayment", null);
exports.PurchasesController = PurchasesController = __decorate([
    (0, swagger_1.ApiTags)('Purchases'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtGuard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('purchases'),
    __metadata("design:paramtypes", [purchases_service_1.PurchasesService])
], PurchasesController);
//# sourceMappingURL=purchases.controller.js.map