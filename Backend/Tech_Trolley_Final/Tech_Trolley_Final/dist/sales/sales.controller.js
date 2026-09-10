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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const create_sale_dto_1 = require("./dtos/create-sale.dto");
const add_payment_dto_1 = require("./dtos/add-payment.dto");
const jwtGuard_1 = require("../auth/jwtGuard");
const roles_guard_1 = require("../auth/roles/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_role_enum_1 = require("../auth/user-role.enum");
const swagger_1 = require("@nestjs/swagger");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    create(createSaleDto, req) {
        return this.salesService.create(createSaleDto, req.user.id);
    }
    findAll() {
        return this.salesService.findAll();
    }
    findOne(id) {
        return this.salesService.findOne(id);
    }
    addPayment(id, paymentDto, req) {
        return this.salesService.addPayment(id, paymentDto, req.user);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.SALESPERSON),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a sale',
        description: 'Creates an IN_PROGRESS sale, records the sale items, and issues stock from ' +
            'inventory in a single transaction. The total is computed by the server ' +
            'as subTotal - discount + vat.',
    }),
    (0, swagger_1.ApiBody)({ type: create_sale_dto_1.CreateSaleDto }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Sale created and stock issued.' }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation error or insufficient stock.',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid token.' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Insufficient role.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sale_dto_1.CreateSaleDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.SALESPERSON),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all sales' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Array of sales.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.SALESPERSON),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a sale with its items and payments' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale UUID', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Sale, its items, and its payments.' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Sale not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER, user_role_enum_1.UserRole.SALESPERSON),
    (0, common_1.Post)(':id/payments'),
    (0, swagger_1.ApiOperation)({
        summary: 'Record a sale payment (customer inflow)',
        description: 'Records a customer payment against the sale AND credits the chosen ' +
            'financial account (inflow) in a single database transaction. If the ' +
            'account is missing or inactive, nothing is saved (full rollback). ' +
            'The same transaction activates a pending customer and changes the sale ' +
            'to INCOMPLETE or COMPLETED from the total paid amount.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'Sale UUID to pay against',
        format: 'uuid',
    }),
    (0, swagger_1.ApiBody)({
        type: add_payment_dto_1.AddSalePaymentDto,
        examples: {
            cash: {
                summary: 'Cash payment',
                value: {
                    amount: 50000,
                    paymentMethod: 'Cash',
                    accountId: 'a3f1c2d4-5678-4abc-9def-0123456789ab',
                    transactionId: 'TXN123',
                    date: '2026-07-26',
                },
            },
        },
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Payment recorded and account balance increased.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation error, sale is completed/returned, payment exceeds due, or the ' +
            'financial account is missing/inactive (transaction rolled back).',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid token.' }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'Insufficient role or salesperson does not own the sale.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Sale not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_payment_dto_1.AddSalePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addPayment", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('Sales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtGuard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map