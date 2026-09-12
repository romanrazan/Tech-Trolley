import { Account } from '../../accounts/entities/accounts.entity';
import { Sale } from './sale.entity';
export declare class SalePayment {
    id: string;
    saleId: string;
    sale?: Sale;
    accountId: string;
    account?: Account;
    amount: number;
    paymentMethod: string;
    transactionId: string | null;
    date: string;
    createdAt: Date;
}
