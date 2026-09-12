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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const accounts_entity_1 = require("./entities/accounts.entity");
let AccountsService = class AccountsService {
    accountsRepository;
    dataSource;
    constructor(accountsRepository, dataSource) {
        this.accountsRepository = accountsRepository;
        this.dataSource = dataSource;
    }
    async create(createAccountDto) {
        const account = this.accountsRepository.create(createAccountDto);
        return this.accountsRepository.save(account);
    }
    async findAll() {
        return this.accountsRepository.find();
    }
    async findPaymentOptions() {
        return this.accountsRepository.find({
            select: { id: true, name: true, type: true },
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const account = await this.accountsRepository.findOne({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        return account;
    }
    async update(id, updateAccountDto) {
        const account = await this.findOne(id);
        Object.assign(account, updateAccountDto);
        return this.accountsRepository.save(account);
    }
    async updateBalance(id, amount) {
        const account = await this.findOne(id);
        account.balance = Number(account.balance) + Number(amount);
        return this.accountsRepository.save(account);
    }
    async applyBalanceChange(manager, accountId, signedAmount, paymentMethod) {
        const account = await manager.findOne(accounts_entity_1.Account, {
            where: { id: accountId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!account)
            throw new common_1.NotFoundException('Financial account not found');
        if (!account.isActive) {
            throw new common_1.BadRequestException('Financial account is inactive');
        }
        if (paymentMethod) {
            const normalizedMethod = (0, accounts_entity_1.normalizePaymentMethod)(paymentMethod);
            if (!normalizedMethod) {
                throw new common_1.BadRequestException('Unsupported payment method');
            }
            if (!(0, accounts_entity_1.isAccountTypeCompatible)(normalizedMethod, account.type)) {
                throw new common_1.BadRequestException(`The selected account is not compatible with ${normalizedMethod}.`);
            }
        }
        const nextBalance = Number(account.balance) + Number(signedAmount);
        if (nextBalance < 0) {
            throw new common_1.BadRequestException('Insufficient account balance');
        }
        account.balance = nextBalance;
        return manager.save(accounts_entity_1.Account, account);
    }
    async recordInflow(manager, accountId, amount, paymentMethod) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Inflow amount must be greater than zero');
        }
        return this.applyBalanceChange(manager, accountId, amount, paymentMethod);
    }
    async recordOutflow(manager, accountId, amount, paymentMethod) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Outflow amount must be greater than zero');
        }
        return this.applyBalanceChange(manager, accountId, -amount, paymentMethod);
    }
    async remove(id) {
        return this.dataSource.transaction(async (manager) => {
            const repository = manager.getRepository(accounts_entity_1.Account);
            const account = await repository.findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!account)
                throw new common_1.NotFoundException('Account not found');
            if (Number(account.balance) !== 0) {
                throw new common_1.ConflictException(`This account cannot be deleted because its balance is ${Number(account.balance).toFixed(2)}. Transfer or adjust the balance to zero first.`);
            }
            await repository.softRemove(account);
            return { message: 'Account deleted successfully.' };
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(accounts_entity_1.Account)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map