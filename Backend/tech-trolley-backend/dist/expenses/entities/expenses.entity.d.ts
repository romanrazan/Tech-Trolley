import { Account } from '../../accounts/entities/accounts.entity';
export declare class Expense {
    id: string;
    category: string;
    amount: number;
    accountId: string;
    account?: Account;
    date: string;
    remarks: string;
    createdAt: Date;
}
