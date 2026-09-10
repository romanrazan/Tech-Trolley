import assert from "node:assert/strict";
import test from "node:test";
import type { Account } from "@/types";
// @ts-expect-error Node's native TypeScript test runner requires the extension.
import * as paymentAccounts from "./payment-accounts.ts";

const {
  accountsForPaymentMethod,
  calculatePaymentDue,
  compatiblePaymentAccountId,
} = paymentAccounts;

const accounts = [
  { id: "cash", name: "Till", type: "Cash", isActive: true },
  { id: "bank", name: "BRAC Bank", type: "Bank", isActive: true },
  { id: "wallet", name: "bKash", type: "Mobile Wallet", isActive: true },
  {
    id: "legacy-wallet",
    name: "Nagad",
    type: "Mobile Banking",
    isActive: true,
  },
  { id: "inactive", name: "Old Till", type: "Cash", isActive: false },
] as Account[];

test("filters active accounts by the selected payment method", () => {
  assert.deepEqual(
    accountsForPaymentMethod(accounts, "Cash").map(({ id }) => id),
    ["cash"],
  );
  assert.deepEqual(
    accountsForPaymentMethod(accounts, "Bank Transfer").map(({ id }) => id),
    ["bank"],
  );
  assert.deepEqual(
    accountsForPaymentMethod(accounts, "Mobile Wallet").map(({ id }) => id),
    ["wallet", "legacy-wallet"],
  );
});

test("accepts minimal payment options because the endpoint returns active accounts only", () => {
  assert.deepEqual(
    accountsForPaymentMethod(
      [{ id: "cash-option", name: "Till", type: "Cash" }],
      "Cash",
    ).map(({ id }) => id),
    ["cash-option"],
  );
});

test("changing method clears an incompatible account selection", () => {
  const bankAccounts = accountsForPaymentMethod(accounts, "Bank Transfer");
  assert.equal(compatiblePaymentAccountId(bankAccounts, "cash"), "bank");

  const noBanks = bankAccounts.filter(() => false);
  assert.equal(compatiblePaymentAccountId(noBanks, "bank"), "");
});

test("calculates current due safely for blank, partial, full, and excess input", () => {
  assert.equal(calculatePaymentDue(25_000, undefined), 25_000);
  assert.equal(calculatePaymentDue(25_000, Number.NaN), 25_000);
  assert.equal(calculatePaymentDue(25_000, 10_000), 15_000);
  assert.equal(calculatePaymentDue(15_000, 15_000), 0);
  assert.equal(calculatePaymentDue(15_000, 20_000), 0);
  assert.equal(calculatePaymentDue(10.01, 0.02), 9.99);
});
