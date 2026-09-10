import type { Money } from "@/types";

export function asNumber(value: Money | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatMoney(value: Money | null | undefined, currency = "৳") {
  return `${currency}${asNumber(value).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(
    "en-BD",
    withTime
      ? {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : { day: "numeric", month: "short", year: "numeric" },
  ).format(parsed);
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TT"
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
export function transactionNumber(prefix: "INV" | "PUR") {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `${prefix}-${stamp}`;
}
