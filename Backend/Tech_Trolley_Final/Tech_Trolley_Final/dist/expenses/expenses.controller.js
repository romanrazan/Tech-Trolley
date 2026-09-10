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
exports.ExpensesController = void 0;
const common_1 = require("@nestjs/common");
const expenses_service_1 = require("./expenses.service");
const create_expense_dto_1 = require("./dtos/create-expense.dto");
const update_expense_dto_1 = require("./dtos/update-expense.dto");
const jwtGuard_1 = require("../auth/jwtGuard");
const roles_guard_1 = require("../auth/roles/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_role_enum_1 = require("../auth/user-role.enum");
const swagger_1 = require("@nestjs/swagger");
let ExpensesController = class ExpensesController {
    expensesService;
    constructor(expensesService) {
        this.expensesService = expensesService;
    }
    create(createExpenseDto) {
        return this.expensesService.create(createExpenseDto);
    }
    findAll() {
        return this.expensesService.findAll();
    }
    findOne(id) {
        return this.expensesService.findOne(id);
    }
    update(id, updateExpenseDto) {
        return this.expensesService.update(id, updateExpenseDto);
    }
    remove(id) {
        return this.expensesService.remove(id);
    }
};
exports.ExpensesController = ExpensesController;
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_expense_dto_1.CreateExpenseDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_expense_dto_1.UpdateExpenseDto]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.OWNER, user_role_enum_1.UserRole.MANAGER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "remove", null);
exports.ExpensesController = ExpensesController = __decorate([
    (0, swagger_1.ApiTags)('Expenses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwtGuard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('expenses'),
    __metadata("design:paramtypes", [expenses_service_1.ExpensesService])
], ExpensesController);
//# sourceMappingURL=expenses.controller.js.map