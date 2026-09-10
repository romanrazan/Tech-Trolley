import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { UpdateAccountDto } from './dtos/update-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(createAccountDto: CreateAccountDto): Promise<import("./entities/accounts.entity").Account>;
    findAll(): Promise<import("./entities/accounts.entity").Account[]>;
    findPaymentOptions(): Promise<Pick<import("./entities/accounts.entity").Account, "name" | "id" | "type">[]>;
    findOne(id: string): Promise<import("./entities/accounts.entity").Account>;
    update(id: string, updateAccountDto: UpdateAccountDto): Promise<import("./entities/accounts.entity").Account>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
