import type { Payment, Sale, User } from "@/types";

function asAmount(value: number | string | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function currentSaleDue(sale: Sale, payments?: Payment[]): number {
  if (!payments && sale.currentDue !== undefined) {
    return asAmount(sale.currentDue);
  }

  const paymentRows = payments ?? sale.payments ?? [];
  const totalCents = Math.round(asAmount(sale.total) * 100);
  const paidCents = paymentRows.reduce(
    (sum, payment) => sum + Math.round(asAmount(payment.amount) * 100),
    0,
  );
  return Math.max(0, totalCents - paidCents) / 100;
}

export function canRecordSalePayment(
  user: Pick<User, "id" | "role"> | null | undefined,
  sale: Sale,
  payments?: Payment[],
): boolean {
  if (!user) return false;

  const canPaySale =
    user.role === "OWNER" ||
    user.role === "MANAGER" ||
    (user.role === "SALESPERSON" && sale.salespersonId === user.id);

  return (
    canPaySale &&
    (sale.status === "IN_PROGRESS" || sale.status === "INCOMPLETE") &&
    currentSaleDue(sale, payments) > 0
  );
}

export function canLoadSalePaymentOptions(
  user: Pick<User, "role"> | null | undefined,
): boolean {
  return (
    user?.role === "OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SALESPERSON"
  );
}
