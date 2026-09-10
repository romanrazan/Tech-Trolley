import { Expense } from '../../expenses/entities/expenses.entity';
import { PurchasePayment } from '../../purchases/entities/purchase-payment.entity';
import { SalePayment } from '../../sales/entities/sale-payment.entity';
export declare const PAYMENT_METHODS: readonly ["Cash", "Bank Transfer", "Mobile Wallet"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export declare function normalizePaymentMethod(value: string): PaymentMethod | null;
export declare function isAccountTypeCompatible(paymentMethod: PaymentMethod, accountType: string): boolean;
export declare class Account {
    id: string;
    name: string;
    type: string;
    accountNumber: string;
    balance: number;
    isActive: boolean;
    deletedAt: Date | null;
    expenses?: Expense[];
    purchasePayments?: PurchasePayment[];
    salePayments?: SalePayment[];
}
