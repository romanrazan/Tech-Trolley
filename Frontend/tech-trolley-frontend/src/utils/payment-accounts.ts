import type { PaymentAccountOption } from "@/types";

type PaymentAccount = PaymentAccountOption & { isActive?: boolean };

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Mobile Wallet",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const ACCOUNT_TYPES_BY_METHOD: Record<PaymentMethod, readonly string[]> = {
  Cash: ["cash"],
  "Bank Transfer": ["bank", "bank account"],
  "Mobile Wallet": [
    "mobile wallet",
    "mobile banking",
    "mobile banking account",
    "wallet",
  ],
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizePaymentMethod(value: string): PaymentMethod | null {
  const normalized = normalize(value);
  return (
    PAYMENT_METHODS.find((method) => normalize(method) === normalized) ?? null
  );
}

export function accountsForPaymentMethod<TAccount extends PaymentAccount>(
  accounts: TAccount[],
  method: string,
): TAccount[] {
  const paymentMethod = normalizePaymentMethod(method);
  if (!paymentMethod) return [];

  const allowedTypes = ACCOUNT_TYPES_BY_METHOD[paymentMethod];
  return accounts.filter(
    (account) =>
      account.isActive !== false && allowedTypes.includes(normalize(account.type)),
  );
}

export function initialPaymentAccountId(accounts: PaymentAccount[]): string {
  return accounts.length === 1 ? accounts[0].id : "";
}

export function compatiblePaymentAccountId(
  compatibleAccounts: PaymentAccount[],
  currentAccountId: string,
): string {
  return compatibleAccounts.some(
    (account) => account.id === currentAccountId,
  )
    ? currentAccountId
    : initialPaymentAccountId(compatibleAccounts);
}

export function calculatePaymentDue(
  total: number,
  paidAmount?: number,
): number {
  const totalCents = Number.isFinite(total) ? Math.round(total * 100) : 0;
  const paidCents =
    Number.isFinite(paidAmount) && Number(paidAmount) > 0
      ? Math.round(Number(paidAmount) * 100)
      : 0;
  return Math.max(0, totalCents - paidCents) / 100;
}
