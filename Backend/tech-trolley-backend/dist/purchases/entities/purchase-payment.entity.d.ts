import { Account } from '../../accounts/entities/accounts.entity';
import { Purchase } from './purchase.entity';
export declare class PurchasePayment {
    id: string;
    purchaseId: string;
    purchase?: Purchase;
    accountId: string;
    account?: Account;
    amount: number;
    paymentMethod: string;
    transactionId: string | null;
    date: string;
    createdAt: Date;
}
