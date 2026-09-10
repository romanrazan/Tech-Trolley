"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Brand, Category, Product, TrackingType } from "@/types";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { formatMoney } from "@/utils/format";
import { parseImeis } from "@/features/transactions/transaction-items-editor";

export interface DraftNewProduct {
  name: string;
  brandId: string;
  categoryId: string;
  trackingType: TrackingType;
  isActive: boolean;
}

export interface DraftPurchaseItem {
  key: string;
  mode: "existing" | "new";
  productId: string;
  newProduct: DraftNewProduct;
  quantity: number | "";
  unitPrice: number | "";
  imeisText: string;
}

export function createDraftPurchaseItem(
  key = crypto.randomUUID(),
): DraftPurchaseItem {
  return {
    key,
    mode: "existing",
    productId: "",
    newProduct: {
      name: "",
      brandId: "",
      categoryId: "",
      trackingType: "QUANTITY",
      isActive: true,
    },
    quantity: 1,
    unitPrice: "",
    imeisText: "",
  };
}

export function PurchaseItemsEditor({
  products,
  brands,
  categories,
  items,
  onChange,
  disabled,
}: {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  items: DraftPurchaseItem[];
  onChange: (items: DraftPurchaseItem[]) => void;
  disabled: boolean;
}) {
  const activeProducts = products.filter(
    (product) => product.isActive && !product.deletedAt,
  );
  const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]));
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  function update(key: string, patch: Partial<DraftPurchaseItem>) {
    onChange(
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function updateNewProduct(
    item: DraftPurchaseItem,
    patch: Partial<DraftNewProduct>,
  ) {
    update(item.key, {
      newProduct: { ...item.newProduct, ...patch },
    });
  }

  function switchMode(item: DraftPurchaseItem, mode: "existing" | "new") {
    update(item.key, {
      mode,
      productId: "",
      newProduct: createDraftPurchaseItem(item.key).newProduct,
      imeisText: "",
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Product items</h3>
          <p className="text-xs text-slate-500">
            Each line can use an existing Product or create a new one with its
            opening stock.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...items, createDraftPurchaseItem()])}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {disabled && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Complete the Supplier information before adding Product items.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => {
          const product = activeProducts.find(
            (entry) => entry.id === item.productId,
          );
          const trackingType =
            item.mode === "existing"
              ? product?.trackingType
              : item.newProduct.trackingType;
          const serialized = trackingType === "SERIALIZED";
          const quantity =
            typeof item.quantity === "number" ? item.quantity : 0;
          const unitPrice =
            typeof item.unitPrice === "number" ? item.unitPrice : 0;

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
                  disabled={disabled || items.length === 1}
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product option">
                  <Select
                    value={item.mode}
                    disabled={disabled}
                    onChange={(event) =>
                      switchMode(item, event.target.value as "existing" | "new")
                    }
                  >
                    <option value="existing">Existing Product</option>
                    <option value="new">New Product</option>
                  </Select>
                </Field>

                {item.mode === "existing" ? (
                  <Field label="Product">
                    <Select
                      value={item.productId}
                      disabled={disabled}
                      onChange={(event) =>
                        update(item.key, {
                          productId: event.target.value,
                          imeisText: "",
                        })
                      }
                    >
                      <option value="">Select Product</option>
                      {activeProducts.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} · {entry.trackingType}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="Product name">
                    <Input
                      value={item.newProduct.name}
                      disabled={disabled}
                      onChange={(event) =>
                        updateNewProduct(item, { name: event.target.value })
                      }
                    />
                  </Field>
                )}

                {item.mode === "existing" && product && (
                  <div className="grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2 sm:grid-cols-5">
                    <div>
                      <span className="block text-xs text-slate-500">Name</span>
                      <strong>{product.name}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">
                        Brand
                      </span>
                      <strong>{brandNames.get(product.brandId) ?? "—"}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">
                        Category
                      </span>
                      <strong>
                        {categoryNames.get(product.categoryId) ?? "—"}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">
                        Tracking
                      </span>
                      <strong>{product.trackingType}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">
                        Current quantity
                      </span>
                      <strong>{product.quantity}</strong>
                    </div>
                  </div>
                )}

                {item.mode === "new" && (
                  <>
                    <Field label="Brand">
                      <Select
                        value={item.newProduct.brandId}
                        disabled={disabled}
                        onChange={(event) =>
                          updateNewProduct(item, {
                            brandId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select Brand</option>
                        {brands
                          .filter((brand) => brand.isActive)
                          .map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                      </Select>
                    </Field>
                    <Field label="Category">
                      <Select
                        value={item.newProduct.categoryId}
                        disabled={disabled}
                        onChange={(event) =>
                          updateNewProduct(item, {
                            categoryId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter((category) => category.isActive)
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </Select>
                    </Field>
                    <Field label="Tracking type">
                      <Select
                        value={item.newProduct.trackingType}
                        disabled={disabled}
                        onChange={(event) =>
                          update(item.key, {
                            newProduct: {
                              ...item.newProduct,
                              trackingType: event.target.value as TrackingType,
                            },
                            imeisText: "",
                          })
                        }
                      >
                        <option value="SERIALIZED">Serialized / IMEI</option>
                        <option value="QUANTITY">Quantity tracked</option>
                      </Select>
                    </Field>
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <span className="text-sm font-medium">
                        Active Product
                      </span>
                      <input
                        type="checkbox"
                        checked={item.newProduct.isActive}
                        disabled={disabled}
                        onChange={(event) =>
                          updateNewProduct(item, {
                            isActive: event.target.checked,
                          })
                        }
                        className="h-5 w-5 accent-blue-600"
                      />
                    </label>
                  </>
                )}

                <Field label="Purchase quantity">
                  <Input
                    value={item.quantity}
                    disabled={disabled}
                    onChange={(event) =>
                      update(item.key, {
                        quantity:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      })
                    }
                    type="number"
                    min="1"
                    step="1"
                  />
                </Field>
                <Field label="Unit price">
                  <Input
                    value={item.unitPrice}
                    disabled={disabled}
                    onChange={(event) =>
                      update(item.key, {
                        unitPrice:
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                      })
                    }
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter unit price"
                  />
                </Field>

                {serialized && (
                  <div className="sm:col-span-2">
                    <Field
                      label={`IMEIs (${parseImeis(item.imeisText).length}/${quantity})`}
                      hint="Enter exactly one IMEI per unit, one per line or separated by commas."
                    >
                      <Textarea
                        value={item.imeisText}
                        disabled={disabled}
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
                  {formatMoney(quantity * unitPrice)}
                </strong>
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
