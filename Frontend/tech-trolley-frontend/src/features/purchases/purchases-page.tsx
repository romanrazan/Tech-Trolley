"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Eye,
  HandCoins,
  Plus,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { purchasesService } from "@/services/purchases";
import { suppliersService } from "@/services/suppliers";
import { productsService } from "@/services/products";
import { accountsService } from "@/services/accounts";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import {
  newPurchaseProductSchema,
  paymentSchema,
  purchaseSchema,
  supplierSchema,
  type PaymentFormValues,
} from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { getApiErrorMessage } from "@/lib/api/client";
import type {
  Account,
  Brand,
  Category,
  Product,
  Purchase,
  PurchaseDetail,
  PurchaseInput,
  PurchaseItemInput,
  Payment,
  Supplier,
  SupplierInput,
} from "@/types";
import {
  asNumber,
  formatDate,
  formatMoney,
  today,
  transactionNumber,
} from "@/utils/format";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  SearchBox,
  Select,
  Textarea,
} from "@/components/ui";
import {
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";
import { RoleGate } from "@/components/auth/role-gate";
import { parseImeis } from "@/features/transactions/transaction-items-editor";
import {
  createDraftPurchaseItem,
  PurchaseItemsEditor,
  type DraftPurchaseItem,
} from "@/features/purchases/purchase-items-editor";
import {
  accountsForPaymentMethod,
  calculatePaymentDue,
  compatiblePaymentAccountId,
  initialPaymentAccountId,
  PAYMENT_METHODS,
} from "@/utils/payment-accounts";

interface PurchaseData {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  accounts: Account[];
  brands: Brand[];
  categories: Category[];
}

function remainingDue(purchase: Purchase, payments?: Payment[]) {
  if (!payments && purchase.currentDue !== undefined) {
    return asNumber(purchase.currentDue);
  }
  const paymentRows = payments ?? purchase.payments ?? [];
  const totalCents = Math.round(asNumber(purchase.total) * 100);
  const paidCents = paymentRows.reduce(
    (sum, payment) => sum + Math.round(asNumber(payment.amount) * 100),
    0,
  );
  return Math.max(0, totalCents - paidCents) / 100;
}

function canRecordPayment(purchase: Purchase, payments?: Payment[]) {
  return (
    (purchase.status === "IN_PROGRESS" || purchase.status === "INCOMPLETE") &&
    remainingDue(purchase, payments) > 0
  );
}

function purchaseStatusTone(status: Purchase["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "INCOMPLETE") return "warning" as const;
  if (status === "IN_PROGRESS") return "info" as const;
  return "danger" as const;
}

export function PurchasesPage() {
  const resource = useApiData<PurchaseData>(
    async () => {
      const [purchases, suppliers, products, accounts, brands, categories] =
        await Promise.all([
          purchasesService.list(),
          suppliersService.list(),
          productsService.list(),
          accountsService.list(),
          brandsService.list(),
          categoriesService.list(),
        ]);
      return {
        purchases,
        suppliers,
        products,
        accounts,
        brands,
        categories,
      };
    },
    {
      purchases: [],
      suppliers: [],
      products: [],
      accounts: [],
      brands: [],
      categories: [],
    },
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierMode, setSupplierMode] = useState<"existing" | "new">(
    "existing",
  );
  const [newSupplier, setNewSupplier] = useState<SupplierInput>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [date, setDate] = useState(today());
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<DraftPurchaseItem[]>([
    createDraftPurchaseItem("item-1"),
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [paymentSubmitLocked, setPaymentSubmitLocked] = useState(false);
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined,
      paymentMethod: "Cash",
      accountId: "",
      transactionId: "",
      date: today(),
    },
  });
  const supplierNames = useMemo(
    () =>
      new Map(
        resource.data.suppliers.map((supplier) => [supplier.id, supplier.name]),
      ),
    [resource.data.suppliers],
  );
  const filtered = useMemo(
    () =>
      resource.data.purchases.filter((purchase) =>
        `${purchase.invoiceNumber} ${supplierNames.get(purchase.supplierId) ?? purchase.supplier?.name ?? ""} ${purchase.status}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data.purchases, search, supplierNames],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((page - 1) * 10, page * 10);
  const total = resource.data.purchases.reduce(
    (sum, purchase) =>
      purchase.status === "CANCELLED" ? sum : sum + asNumber(purchase.total),
    0,
  );
  const paidAmount = useWatch({
    control: paymentForm.control,
    name: "amount",
  });
  const paymentMethod = useWatch({
    control: paymentForm.control,
    name: "paymentMethod",
  });
  const paymentAccountId = useWatch({
    control: paymentForm.control,
    name: "accountId",
  });
  const paymentAccounts = useMemo(
    () => accountsForPaymentMethod(resource.data.accounts, paymentMethod),
    [paymentMethod, resource.data.accounts],
  );
  const paymentTotal = paymentPurchase ? remainingDue(paymentPurchase) : 0;
  const paymentDue = calculatePaymentDue(paymentTotal, paidAmount);
  const hasCompatibleAccount = paymentAccounts.some(
    (account) => account.id === paymentAccountId,
  );
  const supplierReady =
    supplierMode === "existing"
      ? resource.data.suppliers.some(
          (supplier) =>
            supplier.id === supplierId &&
            supplier.isActive &&
            !supplier.deletedAt,
        )
      : supplierSchema.safeParse(newSupplier).success;

  function resetCreate() {
    setInvoiceNumber(transactionNumber("PUR"));
    setSupplierId("");
    setSupplierMode("existing");
    setNewSupplier({ name: "", phone: "", email: "", address: "" });
    setDate(today());
    setRemarks("");
    setItems([createDraftPurchaseItem()]);
    setFormError(null);
  }
  function openCreate() {
    resetCreate();
    setCreateOpen(true);
  }
  async function createPurchase(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!supplierReady) {
      setFormError(
        supplierMode === "existing"
          ? "Select an active Supplier before completing Product items."
          : "Complete all required new Supplier details before completing Product items.",
      );
      return;
    }

    const parsedItems: PurchaseItemInput[] = [];
    const existingProductIds = new Set<string>();
    const newProductNames = new Set<string>();
    const purchaseImeis = new Set<string>();

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      let validatedNewProduct: PurchaseItemInput["newProduct"];
      if (
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        setFormError(
          `Enter a positive whole-number quantity for item ${index + 1}.`,
        );
        return;
      }
      if (
        typeof item.unitPrice !== "number" ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        setFormError(`Enter a valid unit price for item ${index + 1}.`);
        return;
      }
      if (
        Math.abs(item.unitPrice * 100 - Math.round(item.unitPrice * 100)) >=
        1e-8
      ) {
        setFormError(
          `Unit price for item ${index + 1} cannot have more than 2 decimal places.`,
        );
        return;
      }

      let product = resource.data.products.find(
        (entry) =>
          entry.id === item.productId && entry.isActive && !entry.deletedAt,
      );
      if (item.mode === "existing") {
        if (!product) {
          setFormError(`Select an active Product for item ${index + 1}.`);
          return;
        }
        if (existingProductIds.has(product.id)) {
          setFormError(
            `${product.name} is already included. Use one line per existing Product.`,
          );
          return;
        }
        existingProductIds.add(product.id);
      } else {
        const parsedProduct = newPurchaseProductSchema.safeParse(
          item.newProduct,
        );
        if (!parsedProduct.success) {
          setFormError(
            `Item ${index + 1}: ${parsedProduct.error.issues[0]?.message ?? "Check the new Product details."}`,
          );
          return;
        }
        const normalizedName = parsedProduct.data.name.toLocaleLowerCase();
        if (newProductNames.has(normalizedName)) {
          setFormError(
            `The new Product ${parsedProduct.data.name} is listed more than once.`,
          );
          return;
        }
        if (
          resource.data.products.some(
            (entry) => entry.name.trim().toLocaleLowerCase() === normalizedName,
          )
        ) {
          setFormError(
            `${parsedProduct.data.name} already exists. Select it as an Existing Product.`,
          );
          return;
        }
        newProductNames.add(normalizedName);
        validatedNewProduct = parsedProduct.data;
        product = {
          ...parsedProduct.data,
          id: "",
          quantity: 0,
        };
      }

      const imeis = parseImeis(item.imeisText);
      if (
        product.trackingType === "SERIALIZED" &&
        imeis.length !== item.quantity
      ) {
        setFormError(
          `Item ${index + 1} needs exactly ${item.quantity} IMEI number${item.quantity === 1 ? "" : "s"}.`,
        );
        return;
      }
      if (product.trackingType === "QUANTITY" && imeis.length) {
        setFormError(
          `Item ${index + 1} is quantity tracked and cannot contain IMEIs.`,
        );
        return;
      }
      for (const imei of imeis) {
        if (purchaseImeis.has(imei)) {
          setFormError(`IMEI ${imei} is duplicated in this Purchase.`);
          return;
        }
        purchaseImeis.add(imei);
      }

      const itemBase = {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        ...(product.trackingType === "SERIALIZED" ? { imeis } : {}),
      };
      parsedItems.push(
        item.mode === "existing"
          ? { ...itemBase, productId: product.id }
          : { ...itemBase, newProduct: validatedNewProduct! },
      );
    }
    const basePayload = {
      invoiceNumber,
      date,
      items: parsedItems,
      remarks: remarks || undefined,
    };
    const payload: PurchaseInput =
      supplierMode === "existing"
        ? { ...basePayload, supplierId }
        : { ...basePayload, newSupplier };
    const parsed = purchaseSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Check the purchase fields.",
      );
      return;
    }
    setCreating(true);
    try {
      await purchasesService.create(parsed.data);
      toast.success(
        "Purchase created successfully. Record payment to complete the purchase.",
      );
      setCreateOpen(false);
      resource.reload();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }
  async function openDetail(purchase: Purchase) {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await purchasesService.get(purchase.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }
  function openPayment(purchase: Purchase, payments = purchase.payments ?? []) {
    setPaymentPurchase({ ...purchase, payments });
    setPaymentSubmitLocked(false);
    paymentForm.reset({
      amount: undefined,
      paymentMethod: "Cash",
      accountId: initialPaymentAccountId(
        accountsForPaymentMethod(resource.data.accounts, "Cash"),
      ),
      transactionId: "",
      date: today(),
    });
  }
  async function addPayment(values: PaymentFormValues) {
    if (!paymentPurchase || paymentSubmitLocked) return;
    const outstanding = remainingDue(paymentPurchase);
    if (values.amount > outstanding) {
      paymentForm.setError("amount", {
        message: `Paid amount cannot exceed ${formatMoney(outstanding)}.`,
      });
      return;
    }
    if (
      !accountsForPaymentMethod(
        resource.data.accounts,
        values.paymentMethod,
      ).some((account) => account.id === values.accountId)
    ) {
      paymentForm.setError("accountId", {
        message: "Select an active account compatible with the payment method.",
      });
      return;
    }
    setPaymentSubmitLocked(true);
    try {
      await purchasesService.addPayment(paymentPurchase.id, values);
      toast.success("Supplier payment recorded and account debited.");
      setPaymentPurchase(null);
      resource.reload();
      if (detail?.purchase.id === paymentPurchase.id)
        setDetail(await purchasesService.get(paymentPurchase.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPaymentSubmitLocked(false);
    }
  }

  return (
    <RoleGate roles={["OWNER", "MANAGER"]}>
      <div>
        <PageHeader
          title="Purchases"
          description="Create and manage purchases, receive inventory, and track payment status."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New purchase
            </Button>
          }
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total purchase value"
            value={formatMoney(total)}
            icon={ShoppingBag}
          />
          <StatCard
            label="Completed purchases"
            value={
              resource.data.purchases.filter((p) => p.status === "COMPLETED")
                .length
            }
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            label="Suppliers"
            value={resource.data.suppliers.length}
            icon={Truck}
            tone="cyan"
          />
        </div>
        <Card className="overflow-hidden">
          <div className="p-4">
            <SearchBox
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search invoice number or supplier"
            />
          </div>
          <DataTable
            headers={[
              "Invoice",
              "Supplier",
              "Purchase date",
              "Total",
              "Status",
              "Actions",
            ]}
            loading={resource.loading}
            error={resource.error}
            empty={!shown.length}
            onRetry={resource.reload}
          >
            {shown.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-slate-50/70">
                <TableCell className="font-semibold text-blue-600">
                  {purchase.invoiceNumber}
                </TableCell>
                <TableCell>
                  {supplierNames.get(purchase.supplierId) ??
                    purchase.supplier?.name ??
                    purchase.supplierId.slice(0, 8)}
                </TableCell>
                <TableCell>{formatDate(purchase.date)}</TableCell>
                <TableCell className="font-bold text-slate-900">
                  {formatMoney(purchase.total)}
                </TableCell>
                <TableCell>
                  <Badge tone={purchaseStatusTone(purchase.status)}>
                    {purchase.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void openDetail(purchase)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canRecordPayment(purchase) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPayment(purchase)}
                        title="Record payment"
                      >
                        <HandCoins className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </Card>
        <Modal
          open={createOpen}
          wide
          title="New purchase"
          description="Stock is received automatically when this purchase is created."
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  document
                    .getElementById("purchase-form")
                    ?.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true }),
                    )
                }
                disabled={creating}
              >
                {creating ? "Creating…" : "Create Purchase"}
              </Button>
            </>
          }
        >
          <form
            id="purchase-form"
            onSubmit={createPurchase}
            className="space-y-5"
          >
            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 font-bold text-slate-900">
                Purchase information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Invoice number">
                  <Input
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                  />
                </Field>
                <Field label="Purchase date">
                  <Input
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    type="date"
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 font-bold text-slate-900">
                Supplier information
              </h3>
              <div className="space-y-4">
                <Field label="Supplier option">
                  <Select
                    value={supplierMode}
                    onChange={(event) => {
                      const mode = event.target.value as "existing" | "new";
                      setSupplierMode(mode);
                      setSupplierId("");
                      setNewSupplier({
                        name: "",
                        phone: "",
                        email: "",
                        address: "",
                      });
                      setItems([createDraftPurchaseItem()]);
                    }}
                  >
                    <option value="existing">Existing Supplier</option>
                    <option value="new">New Supplier</option>
                  </Select>
                </Field>
                {supplierMode === "existing" ? (
                  <Field label="Supplier">
                    <Select
                      value={supplierId}
                      onChange={(event) => setSupplierId(event.target.value)}
                    >
                      <option value="">Select Supplier</option>
                      {resource.data.suppliers
                        .filter(
                          (supplier) =>
                            supplier.isActive && !supplier.deletedAt,
                        )
                        .map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} · {supplier.phone}
                          </option>
                        ))}
                    </Select>
                  </Field>
                ) : (
                  <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:grid-cols-2">
                    <Field label="Supplier name">
                      <Input
                        value={newSupplier.name}
                        onChange={(event) =>
                          setNewSupplier((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>
                    <Field label="Phone">
                      <Input
                        value={newSupplier.phone}
                        onChange={(event) =>
                          setNewSupplier((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        value={newSupplier.email}
                        onChange={(event) =>
                          setNewSupplier((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        type="email"
                        required
                      />
                    </Field>
                    <Field label="Address">
                      <Input
                        value={newSupplier.address}
                        onChange={(event) =>
                          setNewSupplier((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>
                  </div>
                )}
              </div>
            </section>

            <PurchaseItemsEditor
              products={resource.data.products}
              brands={resource.data.brands}
              categories={resource.data.categories}
              items={items}
              onChange={setItems}
              disabled={!supplierReady}
            />
            <Field label="Remarks (optional)">
              <Textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={3}
              />
            </Field>
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="rounded-xl bg-slate-950 p-4 text-right text-white">
              <span className="text-sm text-slate-400">Purchase total</span>
              <strong className="ml-3 text-xl">
                {formatMoney(
                  items.reduce(
                    (sum, item) =>
                      sum +
                      (typeof item.quantity === "number" ? item.quantity : 0) *
                        (typeof item.unitPrice === "number"
                          ? item.unitPrice
                          : 0),
                    0,
                  ),
                )}
              </strong>
            </div>
          </form>
        </Modal>
        <Modal
          open={Boolean(detail) || detailLoading}
          wide
          title={detail?.purchase.invoiceNumber ?? "Purchase details"}
          onClose={() => setDetail(null)}
          footer={
            detail && canRecordPayment(detail.purchase, detail.payments) ? (
              <Button
                onClick={() => openPayment(detail.purchase, detail.payments)}
              >
                <HandCoins className="h-4 w-4" />
                Record payment
              </Button>
            ) : undefined
          }
        >
          {detailLoading ? (
            <LoadingState />
          ) : (
            detail && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Supplier",
                      value:
                        supplierNames.get(detail.purchase.supplierId) ??
                        detail.purchase.supplier?.name ??
                        detail.purchase.supplierId,
                    },
                    {
                      label: "Supplier phone",
                      value: detail.purchase.supplier?.phone ?? "—",
                    },
                    {
                      label: "Supplier email",
                      value: detail.purchase.supplier?.email ?? "—",
                    },
                    {
                      label: "Supplier address",
                      value: detail.purchase.supplier?.address ?? "—",
                    },
                    { label: "Date", value: formatDate(detail.purchase.date) },
                    {
                      label: "Total",
                      value: formatMoney(detail.purchase.total),
                    },
                    {
                      label: "Paid",
                      value: formatMoney(
                        detail.payments.reduce(
                          (sum, payment) => sum + asNumber(payment.amount),
                          0,
                        ),
                      ),
                    },
                    {
                      label: "Due",
                      value: formatMoney(
                        remainingDue(detail.purchase, detail.payments),
                      ),
                    },
                    {
                      label: "Status",
                      value: detail.purchase.status.replaceAll("_", " "),
                    },
                    {
                      label: "Created",
                      value: formatDate(detail.purchase.createdAt),
                    },
                    {
                      label: "Remarks",
                      value: detail.purchase.remarks || "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="mt-1 break-words font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="mb-2 font-bold">Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead className="bg-slate-50 text-left text-xs text-slate-500">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">Unit price</th>
                          <th className="p-3">IMEIs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-t border-slate-100"
                          >
                            <td className="p-3">
                              {item.product?.name ??
                                resource.data.products.find(
                                  (product) => product.id === item.productId,
                                )?.name ??
                                item.productId}
                            </td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">
                              {formatMoney(item.unitPrice)}
                            </td>
                            <td className="p-3">
                              {item.imeis?.join(", ") || "Quantity tracked"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-bold">Payments</h3>
                  {detail.payments.length ? (
                    <div className="space-y-2">
                      {detail.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm"
                        >
                          <span>
                            {formatDate(payment.date)} · {payment.paymentMethod}
                            {payment.account
                              ? ` · ${payment.account.name} (${payment.account.type})`
                              : ""}
                          </span>
                          <strong>{formatMoney(payment.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No payments recorded.
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </Modal>
        <Modal
          open={Boolean(paymentPurchase)}
          title={`Supplier payment · ${paymentPurchase?.invoiceNumber ?? ""}`}
          onClose={() => setPaymentPurchase(null)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setPaymentPurchase(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void paymentForm.handleSubmit(addPayment)()}
                disabled={
                  !hasCompatibleAccount ||
                  paymentSubmitLocked ||
                  paymentForm.formState.isSubmitting
                }
              >
                {paymentForm.formState.isSubmitting
                  ? "Recording…"
                  : "Record payment"}
              </Button>
            </>
          }
        >
          <form
            onSubmit={paymentForm.handleSubmit(addPayment)}
            className="grid gap-5 sm:grid-cols-2"
          >
            <Field label="Total Amount">
              <Input value={formatMoney(paymentTotal)} readOnly />
            </Field>
            <Field
              label="Paid Amount"
              error={paymentForm.formState.errors.amount?.message}
            >
              <Input
                {...paymentForm.register("amount", { valueAsNumber: true })}
                type="number"
                min="0.01"
                max={paymentTotal || undefined}
                step="0.01"
                placeholder="Enter paid amount"
              />
            </Field>
            <Field label="Due Amount">
              <Input value={formatMoney(Math.max(0, paymentDue))} readOnly />
            </Field>
            <Field
              label="Method"
              error={paymentForm.formState.errors.paymentMethod?.message}
            >
              <Select
                value={paymentMethod}
                onChange={(event) => {
                  const method = event.target.value;
                  const compatible = accountsForPaymentMethod(
                    resource.data.accounts,
                    method,
                  );
                  const currentAccountId = paymentForm.getValues("accountId");
                  paymentForm.setValue("paymentMethod", method, {
                    shouldValidate: true,
                  });
                  paymentForm.setValue(
                    "accountId",
                    compatiblePaymentAccountId(compatible, currentAccountId),
                    { shouldValidate: true },
                  );
                }}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Account (money out)"
                hint={
                  paymentAccounts.length === 0
                    ? "No active account available for this payment method"
                    : undefined
                }
                error={paymentForm.formState.errors.accountId?.message}
              >
                <Select {...paymentForm.register("accountId")}>
                  <option value="">Select account</option>
                  {paymentAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {formatMoney(account.balance)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field
              label="Transaction ID (optional)"
              error={paymentForm.formState.errors.transactionId?.message}
            >
              <Input {...paymentForm.register("transactionId")} />
            </Field>
            <Field
              label="Payment date"
              error={paymentForm.formState.errors.date?.message}
            >
              <Input {...paymentForm.register("date")} type="date" />
            </Field>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
}
