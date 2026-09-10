import assert from "node:assert/strict";
import test from "node:test";
import type { Sale } from "@/types";
// @ts-expect-error Node's native TypeScript test runner requires the extension.
import { sortSalesByPriority } from "./sales-order.ts";

function sale(
  id: string,
  status: Sale["status"],
  createdAt: string,
  invoiceNumber = id,
): Sale {
  return {
    id,
    status,
    createdAt,
    invoiceNumber,
    date: createdAt.slice(0, 10),
  } as Sale;
}

test("sorts known and unknown sale statuses by priority", () => {
  const unknown = sale(
    "unknown",
    "ARCHIVED" as Sale["status"],
    "2026-09-10T12:00:00Z",
  );
  const ordered = sortSalesByPriority([
    sale("completed", "COMPLETED", "2026-09-10T12:00:00Z"),
    unknown,
    sale("incomplete", "INCOMPLETE", "2026-09-10T12:00:00Z"),
    sale("returned", "RETURNED", "2026-09-10T12:00:00Z"),
    sale("progress", "IN_PROGRESS", "2026-09-10T12:00:00Z"),
  ]);

  assert.deepEqual(
    ordered.map(({ id }) => id),
    ["progress", "incomplete", "completed", "returned", "unknown"],
  );
});

test("sorts newest first within the same status without mutating input", () => {
  const input = [
    sale("old", "IN_PROGRESS", "2026-09-09T12:00:00Z"),
    sale("new", "IN_PROGRESS", "2026-09-10T12:00:00Z"),
  ];
  const ordered = sortSalesByPriority(input);

  assert.deepEqual(ordered.map(({ id }) => id), ["new", "old"]);
  assert.deepEqual(input.map(({ id }) => id), ["old", "new"]);
});

test("search filtering preserves priority before pagination", () => {
  const input = [
    sale("completed-1", "COMPLETED", "2026-09-10T12:00:00Z", "MATCH-3"),
    sale("progress-1", "IN_PROGRESS", "2026-09-09T12:00:00Z", "MATCH-1"),
    sale("incomplete-1", "INCOMPLETE", "2026-09-10T12:00:00Z", "MATCH-2"),
    sale("ignored", "IN_PROGRESS", "2026-09-11T12:00:00Z", "OTHER"),
  ];
  const filtered = input.filter((entry) =>
    entry.invoiceNumber.toLowerCase().includes("match"),
  );
  const firstPage = sortSalesByPriority(filtered).slice(0, 2);

  assert.deepEqual(firstPage.map(({ id }) => id), [
    "progress-1",
    "incomplete-1",
  ]);
});
