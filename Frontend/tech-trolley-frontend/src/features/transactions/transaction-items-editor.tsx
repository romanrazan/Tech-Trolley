"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { formatMoney } from "@/utils/format";

export interface DraftItem {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number | "";
  imeisText: string;
}

export function parseImeis(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TransactionItemsEditor({
  products,
  items,
  onChange,
  enforceAvailableStock = false,
}: {
  products: Product[];
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
  enforceAvailableStock?: boolean;
}) {
  function update(key: string, patch: Partial<DraftItem>) {
    onChange(
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }
  function add() {
    onChange([
      ...items,
      {
        key: crypto.randomUUID(),
        productId: "",
        quantity: 1,
        unitPrice: "",
        imeisText: "",
      },
    ]);
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Items</h3>
          <p className="text-xs text-slate-500">
            Serialized products require one IMEI per unit.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const product = products.find((entry) => entry.id === item.productId);
          const serialized = product?.trackingType === "SERIALIZED";
          return (
            <Card key={item.key} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">
                  Item {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() =>
                    onChange(items.filter((entry) => entry.key !== item.key))
                  }
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Product">
                  <Select
                    value={item.productId}
                    onChange={(event) => {
                      const id = event.target.value;
                      update(item.key, {
                        productId: id,
                        unitPrice: "",
                        imeisText: "",
                      });
                    }}
                  >
                    <option value="">Select product</option>
                    {products
                      .filter((entry) => entry.isActive)
                      .map((entry) => (
                        <option
                          key={entry.id}
                          value={entry.id}
                          disabled={
                            enforceAvailableStock && entry.quantity <= 0
                          }
                        >
                          {entry.name} · {entry.trackingType}
                          {enforceAvailableStock
                            ? entry.quantity > 0
                              ? ` · Available: ${entry.quantity}`
                              : " · Out of stock"
                            : ""}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field
                  label="Quantity"
                  hint={
                    enforceAvailableStock && product
                      ? `${product.quantity} currently available`
                      : undefined
                  }
                >
                  <Input
                    value={item.quantity}
                    onChange={(event) =>
                      update(item.key, {
                        quantity: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                    type="number"
                    min="1"
                    max={
                      enforceAvailableStock && product
                        ? product.quantity
                        : undefined
                    }
                    step="1"
                  />
                </Field>
                <Field label="Unit price">
                  <Input
                    value={item.unitPrice}
                    onChange={(event) => {
                      const value = event.target.value;
                      update(item.key, {
                        unitPrice: value === "" ? "" : Number(value),
                      });
                    }}
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                </Field>
                {serialized && (
                  <div className="sm:col-span-3">
                    <Field
                      label={`IMEIs (${parseImeis(item.imeisText).length}/${item.quantity})`}
                      hint="Enter one per line or separate with commas."
                    >
                      <Textarea
                        value={item.imeisText}
                        onChange={(event) =>
                          update(item.key, { imeisText: event.target.value })
                        }
                        rows={3}
                        placeholder="356938035643809"
                      />
                    </Field>
                  </div>
                )}
              </div>
              <p className="mt-3 text-right text-sm text-slate-500">
                Line total:{" "}
                <strong className="text-slate-900">
                  {formatMoney(
                    item.quantity *
                      (typeof item.unitPrice === "number" ? item.unitPrice : 0),
                  )}
                </strong>
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
