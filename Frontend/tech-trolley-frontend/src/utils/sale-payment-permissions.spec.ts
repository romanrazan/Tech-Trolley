import assert from "node:assert/strict";
import test from "node:test";
import type { Sale, User } from "@/types";
// @ts-expect-error Node's native TypeScript test runner requires the extension.
import * as permissions from "./sale-payment-permissions.ts";

const { canRecordSalePayment } = permissions;

const salesperson = {
  id: "salesperson-id",
  role: "SALESPERSON",
} as Pick<User, "id" | "role">;

function sale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "sale-id",
    invoiceNumber: "INV-1",
    customerId: "customer-id",
    salespersonId: "salesperson-id",
    date: "2026-09-10",
    subTotal: 100,
    discount: 0,
    vat: 0,
    total: 100,
    status: "IN_PROGRESS",
    currentDue: 100,
    createdAt: "2026-09-10T00:00:00.000Z",
    ...overrides,
  };
}

test("salesperson can open the shared payment flow for own eligible sales", () => {
  assert.equal(canRecordSalePayment(salesperson, sale()), true);
  assert.equal(
    canRecordSalePayment(salesperson, sale({ status: "INCOMPLETE" })),
    true,
  );
});

test("salesperson cannot pay another salesperson sale", () => {
  assert.equal(
    canRecordSalePayment(
      salesperson,
      sale({ salespersonId: "another-salesperson-id" }),
    ),
    false,
  );
});

test("payment action stays hidden for final states and zero due", () => {
  for (const status of ["COMPLETED", "RETURNED", "CANCELLED"] as const) {
    assert.equal(canRecordSalePayment(salesperson, sale({ status })), false);
  }
  assert.equal(canRecordSalePayment(salesperson, sale({ currentDue: 0 })), false);
});

test("owner and manager can pay any eligible sale", () => {
  const anotherSale = sale({ salespersonId: "another-salesperson-id" });
  assert.equal(
    canRecordSalePayment({ id: "owner-id", role: "OWNER" }, anotherSale),
    true,
  );
  assert.equal(
    canRecordSalePayment({ id: "manager-id", role: "MANAGER" }, anotherSale),
    true,
  );
});
