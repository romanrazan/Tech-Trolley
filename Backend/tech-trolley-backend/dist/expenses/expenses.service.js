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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expenses_entity_1 = require("./entities/expenses.entity");
const accounts_service_1 = require("../accounts/accounts.service");
let ExpensesService = class ExpensesService {
    expensesRepository;
    accountsService;
    dataSource;
    constructor(expensesRepository, accountsService, dataSource) {
        this.expensesRepository = expensesRepository;
        this.accountsService = accountsService;
        this.dataSource = dataSource;
    }
    async create(createExpenseDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const expense = queryRunner.manager.create(expenses_entity_1.Expense, createExpenseDto);
            const savedExpense = await queryRunner.manager.save(expense);
            await this.accountsService.recordOutflow(queryRunner.manager, createExpenseDto.accountId, createExpenseDto.amount);
            await queryRunner.commitTransaction();
            return savedExpense;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw new common_1.BadRequestException(err instanceof Error ? err.message : String(err));
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll() {
        return this.expensesRepository.find({
            relations: { account: true },
            withDeleted: true,
        });
    }
    async findOne(id) {
        const expense = await this.expensesRepository.findOne({
            where: { id },
            relations: { account: true },
            withDeleted: true,
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        return expense;
    }
    async update(id, updateExpenseDto) {
        const expense = await this.findOne(id);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (expense.accountId !== updateExpenseDto.accountId) {
                await this.accountsService.applyBalanceChange(queryRunner.manager, expense.accountId, Number(expense.amount));
                await this.accountsService.recordOutflow(queryRunner.manager, updateExpenseDto.accountId, updateExpenseDto.amount);
            }
            else {
                const difference = Number(updateExpenseDto.amount) - Number(expense.amount);
                if (difference !== 0) {
                    await this.accountsService.applyBalanceChange(queryRunner.manager, expense.accountId, -difference);
                }
            }
            Object.assign(expense, updateExpenseDto);
            const savedExpense = await queryRunner.manager.save(expenses_entity_1.Expense, expense);
            await queryRunner.commitTransaction();
            return savedExpense;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw new common_1.BadRequestException(err instanceof Error ? err.message : String(err));
        }
        finally {
            await queryRunner.release();
        }
    }
    async remove(id) {
        const expense = await this.findOne(id);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.accountsService.applyBalanceChange(queryRunner.manager, expense.accountId, Number(expense.amount));
            await queryRunner.manager.remove(expenses_entity_1.Expense, expense);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw new common_1.BadRequestException(err instanceof Error ? err.message : String(err));
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expenses_entity_1.Expense)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        accounts_service_1.AccountsService,
        typeorm_2.DataSource])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map