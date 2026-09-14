"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { formatMoney } from "@/utils/format";

export interface DraftItem {
  key: string;
  productId: string;
  quantity: number | "";
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
  fieldErrors = {},
  onClearFieldError,
}: {
  products: Product[];
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
  enforceAvailableStock?: boolean;
  fieldErrors?: Record<string, string>;
  onClearFieldError?: (fieldId: string) => void;
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
          const productFieldId = `sale-item-${item.key}-product`;
          const quantityFieldId = `sale-item-${item.key}-quantity`;
          const unitPriceFieldId = `sale-item-${item.key}-unit-price`;
          const imeisFieldId = `sale-item-${item.key}-imeis`;
          const quantity =
            typeof item.quantity === "number" ? item.quantity : 0;
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
                <Field label="Product" error={fieldErrors[productFieldId]}>
                  <Select
                    id={productFieldId}
                    aria-invalid={Boolean(fieldErrors[productFieldId])}
                    value={item.productId}
                    onChange={(event) => {
                      const id = event.target.value;
                      onClearFieldError?.(productFieldId);
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
                  error={fieldErrors[quantityFieldId]}
                >
                  <Input
                    id={quantityFieldId}
                    aria-invalid={Boolean(fieldErrors[quantityFieldId])}
                    value={item.quantity}
                    onChange={(event) => {
                      onClearFieldError?.(quantityFieldId);
                      update(item.key, {
                        quantity:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      });
                    }}
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
                <Field label="Unit price" error={fieldErrors[unitPriceFieldId]}>
                  <Input
                    id={unitPriceFieldId}
                    aria-invalid={Boolean(fieldErrors[unitPriceFieldId])}
                    value={item.unitPrice}
                    onChange={(event) => {
                      const value = event.target.value;
                      onClearFieldError?.(unitPriceFieldId);
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
                      label={`IMEIs (${parseImeis(item.imeisText).length}/${quantity})`}
                      hint="Enter one per line or separate with commas."
                      error={fieldErrors[imeisFieldId]}
                    >
                      <Textarea
                        id={imeisFieldId}
                        aria-invalid={Boolean(fieldErrors[imeisFieldId])}
                        value={item.imeisText}
                        onChange={(event) => {
                          onClearFieldError?.(imeisFieldId);
                          update(item.key, { imeisText: event.target.value });
                        }}
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
                    quantity *
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
