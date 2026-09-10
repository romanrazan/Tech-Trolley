import type { Sale } from "@/types";

const STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 0,
  INCOMPLETE: 1,
  COMPLETED: 2,
  RETURNED: 3,
  CANCELLED: 3,
};

function normalizedStatus(status: string): string {
  return status.trim().toUpperCase();
}

function saleTimestamp(sale: Sale): number {
  const createdAt = Date.parse(sale.createdAt);
  if (Number.isFinite(createdAt)) return createdAt;

  const saleDate = Date.parse(sale.date);
  return Number.isFinite(saleDate) ? saleDate : 0;
}

export function compareSalesByPriority(left: Sale, right: Sale): number {
  const leftStatus = normalizedStatus(left.status);
  const rightStatus = normalizedStatus(right.status);
  const priorityDifference =
    (STATUS_PRIORITY[leftStatus] ?? 4) -
    (STATUS_PRIORITY[rightStatus] ?? 4);
  if (priorityDifference !== 0) return priorityDifference;

  const timeDifference = saleTimestamp(right) - saleTimestamp(left);
  if (timeDifference !== 0) return timeDifference;

  const invoiceDifference = right.invoiceNumber.localeCompare(
    left.invoiceNumber,
  );
  return invoiceDifference || right.id.localeCompare(left.id);
}

export function sortSalesByPriority(sales: Sale[]): Sale[] {
  return [...sales].sort(compareSalesByPriority);
}
