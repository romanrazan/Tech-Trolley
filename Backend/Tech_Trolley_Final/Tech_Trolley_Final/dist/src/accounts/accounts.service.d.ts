import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from './entities/accounts.entity';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
export declare class AccountsService {
    private accountsRepository;
    private dataSource;
    constructor(accountsRepository: Repository<Account>, dataSource: DataSource);
    create(createAccountDto: CreateAccountDto): Promise<Account>;
    findAll(): Promise<Account[]>;
    findPaymentOptions(): Promise<Array<Pick<Account, 'id' | 'name' | 'type'>>>;
    findOne(id: string): Promise<Account>;
    update(id: string, updateAccountDto: UpdateAccountDto): Promise<Account>;
    updateBalance(id: string, amount: number): Promise<Account>;
    applyBalanceChange(manager: EntityManager, accountId: string, signedAmount: number, paymentMethod?: string): Promise<Account>;
    recordInflow(manager: EntityManager, accountId: string, amount: number, paymentMethod?: string): Promise<Account>;
    recordOutflow(manager: EntityManager, accountId: string, amount: number, paymentMethod?: string): Promise<Account>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
