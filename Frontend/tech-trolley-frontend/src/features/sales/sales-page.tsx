"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeDollarSign,
  CheckCircle2,
  Eye,
  HandCoins,
  Plus,
  ShoppingCart,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { salesService } from "@/services/sales";
import { customersService } from "@/services/customers";
import { productsService } from "@/services/products";
import { accountsService } from "@/services/accounts";
import { inventoryService } from "@/services/inventory";
import {
  customerSchema,
  paymentSchema,
  saleSchema,
  type PaymentFormValues,
} from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type {
  Customer,
  PaymentAccountOption,
  Product,
  Sale,
  SaleDetail,
  SaleInput,
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
} from "@/components/ui";
import {
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";
import {
  parseImeis,
  TransactionItemsEditor,
  type DraftItem,
} from "@/features/transactions/transaction-items-editor";
import {
  accountsForPaymentMethod,
  calculatePaymentDue,
  compatiblePaymentAccountId,
  initialPaymentAccountId,
  PAYMENT_METHODS,
} from "@/utils/payment-accounts";
import { sortSalesByPriority } from "@/utils/sales-order";
import {
  canLoadSalePaymentOptions,
  canRecordSalePayment,
  currentSaleDue,
} from "@/utils/sale-payment-permissions";

interface SalesData {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  accounts: PaymentAccountOption[];
}
const draftItem = (key = crypto.randomUUID()): DraftItem => ({
  key,
  productId: "",
  quantity: 1,
  unitPrice: "",
  imeisText: "",
});
type NumericDraft = number | "";
type SaleFieldErrors = Record<string, string>;

function focusFirstInvalidField(errors: SaleFieldErrors) {
  const firstFieldId = Object.keys(errors)[0];
  if (!firstFieldId) return;
  requestAnimationFrame(() => {
    const field = document.getElementById(firstFieldId);
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  });
}

function saleStatusTone(status: Sale["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "INCOMPLETE") return "warning" as const;
  if (status === "IN_PROGRESS") return "info" as const;
  return "danger" as const;
}

function saleStatusLabel(status: Sale["status"]) {
  return status.replaceAll("_", " ");
}

export function SalesPage() {
  const { user } = useAuth();
  const canUseSalePaymentOptions = canLoadSalePaymentOptions(user);
  const resource = useApiData<SalesData>(
    async () => {
      const [sales, customers, products, accounts] = await Promise.all([
        salesService.list(),
        customersService.list(),
        productsService.list(),
        canUseSalePaymentOptions
          ? accountsService.paymentOptions()
          : Promise.resolve([]),
      ]);
      return {
        sales,
        customers,
        products,
        accounts,
      };
    },
    { sales: [], customers: [], products: [], accounts: [] },
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    "existing",
  );
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [date, setDate] = useState(today());
  const [discount, setDiscount] = useState<NumericDraft>("");
  const [vat, setVat] = useState<NumericDraft>("");
  const [items, setItems] = useState<DraftItem[]>([draftItem("item-1")]);
  const [fieldErrors, setFieldErrors] = useState<SaleFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
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
  const customerNames = useMemo(
    () =>
      new Map(
        resource.data.customers.map((customer) => [customer.id, customer.name]),
      ),
    [resource.data.customers],
  );
  const filtered = useMemo(() => {
    const matching = resource.data.sales.filter((sale) =>
      `${sale.invoiceNumber} ${customerNames.get(sale.customerId) ?? sale.customer?.name ?? ""} ${sale.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    return sortSalesByPriority(matching);
  }, [resource.data.sales, search, customerNames]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((page - 1) * 10, page * 10);
  const salesTotal = resource.data.sales.reduce(
    (sum, sale) => sum + asNumber(sale.total),
    0,
  );
  const discounts = resource.data.sales.reduce(
    (sum, sale) => sum + asNumber(sale.discount),
    0,
  );
  const vatTotal = resource.data.sales.reduce(
    (sum, sale) => sum + asNumber(sale.vat),
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
  const paymentTotal = paymentSale ? currentSaleDue(paymentSale) : 0;
  const paymentDue = calculatePaymentDue(paymentTotal, paidAmount);
  const hasCompatibleAccount = paymentAccounts.some(
    (account) => account.id === paymentAccountId,
  );

  function resetCreate() {
    setInvoiceNumber(transactionNumber("INV"));
    setCustomerMode("existing");
    setCustomerId("");
    setNewCustomer({ name: "", phone: "", email: "", address: "" });
    setDate(today());
    setDiscount("");
    setVat("");
    setItems([draftItem()]);
    setFieldErrors({});
    setFormError(null);
  }
  function openCreate() {
    resetCreate();
    setCreateOpen(true);
  }
  function clearFieldError(fieldId: string) {
    setFieldErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }
  async function createSale(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const errors: SaleFieldErrors = {};
    const addError = (fieldId: string, message: string) => {
      errors[fieldId] ??= message;
    };

    if (!invoiceNumber.trim()) {
      addError("sale-invoice-number", "Invoice number is required.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      addError("sale-date", "Use a valid date.");
    }
    if (customerMode === "existing") {
      if (
        !resource.data.customers.some((customer) => customer.id === customerId)
      ) {
        addError("sale-customer", "Select a valid customer.");
      }
    } else {
      const customerResult = customerSchema.safeParse(newCustomer);
      if (!customerResult.success) {
        const customerFields: Record<string, string> = {
          name: "sale-customer-name",
          phone: "sale-customer-phone",
          email: "sale-customer-email",
          address: "sale-customer-address",
        };
        for (const issue of customerResult.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && customerFields[field]) {
            addError(customerFields[field], issue.message);
          }
        }
      }
    }

    const discountValue = discount === "" ? 0 : discount;
    const vatValue = vat === "" ? 0 : vat;
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      addError("sale-discount", "Discount cannot be negative.");
    }
    if (!Number.isFinite(vatValue) || vatValue < 0) {
      addError("sale-vat", "VAT cannot be negative.");
    }

    const parsedItems: SaleInput["items"] = [];
    const imeiFields = new Map<string, string>();
    const requestedByProduct = new Map<
      string,
      { quantity: number; quantityFieldId: string }
    >();
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const productFieldId = `sale-item-${item.key}-product`;
      const quantityFieldId = `sale-item-${item.key}-quantity`;
      const unitPriceFieldId = `sale-item-${item.key}-unit-price`;
      const imeisFieldId = `sale-item-${item.key}-imeis`;
      const product = resource.data.products.find(
        (entry) => entry.id === item.productId,
      );
      if (!product) {
        addError(productFieldId, `Select a product for item ${index + 1}.`);
      }
      const quantityValue =
        typeof item.quantity === "number" ? item.quantity : Number.NaN;
      const validQuantity =
        Number.isFinite(quantityValue) &&
        Number.isInteger(quantityValue) &&
        quantityValue > 0;
      if (!validQuantity) {
        addError(
          quantityFieldId,
          `Enter a positive whole-number quantity for item ${index + 1}.`,
        );
      }
      const unitPriceValue =
        typeof item.unitPrice === "number" ? item.unitPrice : Number.NaN;
      const validUnitPrice =
        Number.isFinite(unitPriceValue) && unitPriceValue > 0;
      if (!validUnitPrice) {
        addError(
          unitPriceFieldId,
          `Enter a valid unit price for item ${index + 1}.`,
        );
      }
      const imeis = parseImeis(item.imeisText);
      if (
        product?.trackingType === "SERIALIZED" &&
        validQuantity &&
        imeis.length !== quantityValue
      ) {
        addError(
          imeisFieldId,
          `Item ${index + 1} needs exactly ${quantityValue} IMEI number${quantityValue === 1 ? "" : "s"}.`,
        );
      }
      for (const imei of imeis) {
        const earlierField = imeiFields.get(imei);
        if (earlierField) {
          addError(earlierField, "Every IMEI in the sale must be unique.");
          addError(imeisFieldId, `IMEI ${imei} is duplicated in this sale.`);
        } else {
          imeiFields.set(imei, imeisFieldId);
        }
      }

      if (product && validQuantity) {
        const existing = requestedByProduct.get(product.id);
        requestedByProduct.set(product.id, {
          quantity: (existing?.quantity ?? 0) + quantityValue,
          quantityFieldId: existing?.quantityFieldId ?? quantityFieldId,
        });
      }
      parsedItems.push({
        productId: item.productId,
        quantity: quantityValue,
        unitPrice: unitPriceValue,
        ...(product?.trackingType === "SERIALIZED" ? { imeis } : {}),
      });
    }
    for (const [productId, request] of requestedByProduct) {
      const product = resource.data.products.find(
        (entry) => entry.id === productId,
      );
      if (!product?.isActive) {
        addError(
          request.quantityFieldId,
          `${product?.name ?? "The selected product"} is inactive.`,
        );
      }
      if (product && product.quantity <= 0) {
        addError(request.quantityFieldId, `${product.name} is out of stock.`);
      }
      if (product && request.quantity > product.quantity) {
        addError(
          request.quantityFieldId,
          `Only ${product.quantity} units of ${product.name} are available.`,
        );
      }
    }

    const subtotalValue = parsedItems.reduce(
      (sum, item) =>
        Number.isFinite(item.quantity) && Number.isFinite(item.unitPrice)
          ? sum + item.quantity * item.unitPrice
          : sum,
      0,
    );
    if (subtotalValue - discountValue + vatValue < 0) {
      addError("sale-discount", "The final total cannot be negative.");
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstInvalidField(errors);
      return;
    }

    const basePayload = {
      invoiceNumber: invoiceNumber.trim(),
      date,
      discount: discountValue,
      vat: vatValue,
      items: parsedItems,
    };
    const payload: SaleInput =
      customerMode === "existing"
        ? { ...basePayload, customerId }
        : {
            ...basePayload,
            newCustomer: {
              name: newCustomer.name,
              phone: newCustomer.phone,
              email: newCustomer.email || undefined,
              address: newCustomer.address || undefined,
            },
          };
    const parsed = saleSchema.safeParse(payload);
    if (!parsed.success) {
      const schemaErrors: SaleFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const [section, index, field] = issue.path;
        let fieldId: string | undefined;
        if (section === "invoiceNumber") fieldId = "sale-invoice-number";
        if (section === "date") fieldId = "sale-date";
        if (section === "discount") fieldId = "sale-discount";
        if (section === "vat") fieldId = "sale-vat";
        if (section === "customerId") fieldId = "sale-customer";
        if (section === "newCustomer" && typeof index === "string") {
          fieldId = `sale-customer-${index}`;
        }
        if (
          section === "items" &&
          typeof index === "number" &&
          items[index] &&
          typeof field === "string"
        ) {
          const suffix = field === "unitPrice" ? "unit-price" : field;
          fieldId = `sale-item-${items[index].key}-${suffix}`;
        }
        if (fieldId) schemaErrors[fieldId] ??= issue.message;
      }
      if (Object.keys(schemaErrors).length > 0) {
        setFieldErrors(schemaErrors);
        focusFirstInvalidField(schemaErrors);
      } else {
        setFormError(
          parsed.error.issues[0]?.message ?? "Check the sale fields.",
        );
      }
      return;
    }
    setFieldErrors({});
    setCreating(true);
    try {
      for (const item of parsed.data.items)
        for (const imei of item.imeis ?? []) {
          const unit = await inventoryService.imei(imei);
          if (unit.status !== "IN_STOCK")
            throw new Error(
              `IMEI ${imei} is ${unit.status.toLowerCase().replace("_", " ")}.`,
            );
          if (unit.productId !== item.productId)
            throw new Error(`IMEI ${imei} belongs to a different product.`);
        }
      await salesService.create(parsed.data);
      toast.success("Sale created and inventory issued.");
      setCreateOpen(false);
      resource.reload();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }
  async function openDetail(sale: Sale) {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await salesService.get(sale.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }
  async function openPayment(sale: Sale) {
    if (!canRecordSalePayment(user, sale)) return;
    setPaymentSale(sale);
    setPaymentSubmitLocked(false);
    setPaymentLoading(true);
    setPaymentError(null);
    const cashAccounts = accountsForPaymentMethod(
      resource.data.accounts,
      "Cash",
    );
    paymentForm.reset({
      amount: undefined,
      paymentMethod: "Cash",
      accountId: initialPaymentAccountId(cashAccounts),
      transactionId: "",
      date: today(),
    });
    try {
      const latest = await salesService.get(sale.id);
      const authoritativeSale = {
        ...latest.sale,
        payments: latest.payments,
      };
      setPaymentSale(authoritativeSale);
      if (!canRecordSalePayment(user, latest.sale, latest.payments)) {
        setPaymentError("This sale no longer has an outstanding payment due.");
      }
    } catch (error) {
      setPaymentError(getApiErrorMessage(error));
    } finally {
      setPaymentLoading(false);
    }
  }
  async function addPayment(values: PaymentFormValues) {
    if (!paymentSale || paymentLoading || paymentError || paymentSubmitLocked)
      return;
    const due = currentSaleDue(paymentSale);
    if (values.amount > due) {
      paymentForm.setError("amount", {
        message: `Payment cannot exceed the outstanding due of ${formatMoney(due)}.`,
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
      await salesService.addPayment(paymentSale.id, values);
      toast.success("Customer payment recorded and account credited.");
      setPaymentSale(null);
      resource.reload();
      if (detail?.sale.id === paymentSale.id)
        setDetail(await salesService.get(paymentSale.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPaymentSubmitLocked(false);
    }
  }
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (typeof item.quantity === "number" ? item.quantity : 0) *
        (typeof item.unitPrice === "number" ? item.unitPrice : 0),
    0,
  );
  const discountValue = typeof discount === "number" ? discount : 0;
  const vatValue = typeof vat === "number" ? vat : 0;
  const finalTotal = subtotal - discountValue + vatValue;

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Create and manage sales, track payment status, and view completed transactions."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New sale
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total sales value"
          value={formatMoney(salesTotal)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Total discounts"
          value={formatMoney(discounts)}
          icon={Tags}
          tone="cyan"
        />
        <StatCard
          label="Total VAT"
          value={formatMoney(vatTotal)}
          icon={BadgeDollarSign}
          tone="violet"
        />
        <StatCard
          label="Completed"
          value={
            resource.data.sales.filter((sale) => sale.status === "COMPLETED")
              .length
          }
          icon={CheckCircle2}
          tone="green"
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
            placeholder="Search invoice number or customer"
          />
        </div>
        <DataTable
          headers={[
            "Invoice",
            "Customer",
            "Sale date",
            "Subtotal",
            "Discount",
            "VAT",
            "Total",
            "Status",
            "Actions",
          ]}
          loading={resource.loading}
          error={resource.error}
          empty={!shown.length}
          onRetry={resource.reload}
        >
          {shown.map((sale) => (
            <tr key={sale.id} className="hover:bg-slate-50/70">
              <TableCell className="font-semibold text-blue-600">
                {sale.invoiceNumber}
              </TableCell>
              <TableCell>
                {customerNames.get(sale.customerId) ??
                  sale.customer?.name ??
                  sale.customerId.slice(0, 8)}
              </TableCell>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell>{formatMoney(sale.subTotal)}</TableCell>
              <TableCell>{formatMoney(sale.discount)}</TableCell>
              <TableCell>{formatMoney(sale.vat)}</TableCell>
              <TableCell className="font-bold text-slate-900">
                {formatMoney(sale.total)}
              </TableCell>
              <TableCell>
                <Badge tone={saleStatusTone(sale.status)}>
                  {saleStatusLabel(sale.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void openDetail(sale)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canRecordSalePayment(user, sale) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void openPayment(sale)}
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
        title="New sale"
        description="Selected products are verified before the sale is created."
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                document
                  .getElementById("sale-form")
                  ?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                  )
              }
              disabled={creating}
            >
              {creating ? "Creating…" : "Create sale"}
            </Button>
          </>
        }
      >
        <form
          id="sale-form"
          onSubmit={createSale}
          className="space-y-5"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Invoice number"
              error={fieldErrors["sale-invoice-number"]}
            >
              <Input
                id="sale-invoice-number"
                aria-invalid={Boolean(fieldErrors["sale-invoice-number"])}
                value={invoiceNumber}
                onChange={(event) => {
                  clearFieldError("sale-invoice-number");
                  setInvoiceNumber(event.target.value);
                }}
              />
            </Field>
            <Field label="Customer option">
              <Select
                value={customerMode}
                onChange={(event) => {
                  setFieldErrors({});
                  setCustomerMode(event.target.value as "existing" | "new");
                }}
              >
                <option value="existing">Existing customer</option>
                <option value="new">New customer</option>
              </Select>
            </Field>
            <Field label="Sale date" error={fieldErrors["sale-date"]}>
              <Input
                id="sale-date"
                aria-invalid={Boolean(fieldErrors["sale-date"])}
                value={date}
                onChange={(event) => {
                  clearFieldError("sale-date");
                  setDate(event.target.value);
                }}
                type="date"
              />
            </Field>
          </div>
          {customerMode === "existing" ? (
            <Field label="Customer" error={fieldErrors["sale-customer"]}>
              <Select
                id="sale-customer"
                aria-invalid={Boolean(fieldErrors["sale-customer"])}
                value={customerId}
                onChange={(event) => {
                  clearFieldError("sale-customer");
                  setCustomerId(event.target.value);
                }}
              >
                <option value="">Select customer</option>
                {resource.data.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.phone}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:grid-cols-2">
              <Field label="Name" error={fieldErrors["sale-customer-name"]}>
                <Input
                  id="sale-customer-name"
                  aria-invalid={Boolean(fieldErrors["sale-customer-name"])}
                  value={newCustomer.name}
                  onChange={(event) => {
                    clearFieldError("sale-customer-name");
                    setNewCustomer((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                  }}
                />
              </Field>
              <Field label="Phone" error={fieldErrors["sale-customer-phone"]}>
                <Input
                  id="sale-customer-phone"
                  aria-invalid={Boolean(fieldErrors["sale-customer-phone"])}
                  value={newCustomer.phone}
                  onChange={(event) => {
                    clearFieldError("sale-customer-phone");
                    setNewCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }));
                  }}
                />
              </Field>
              <Field
                label="Email (optional)"
                error={fieldErrors["sale-customer-email"]}
              >
                <Input
                  id="sale-customer-email"
                  aria-invalid={Boolean(fieldErrors["sale-customer-email"])}
                  value={newCustomer.email}
                  onChange={(event) => {
                    clearFieldError("sale-customer-email");
                    setNewCustomer((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                  }}
                  type="email"
                />
              </Field>
              <Field
                label="Address (optional)"
                error={fieldErrors["sale-customer-address"]}
              >
                <Input
                  id="sale-customer-address"
                  aria-invalid={Boolean(fieldErrors["sale-customer-address"])}
                  value={newCustomer.address}
                  onChange={(event) => {
                    clearFieldError("sale-customer-address");
                    setNewCustomer((current) => ({
                      ...current,
                      address: event.target.value,
                    }));
                  }}
                />
              </Field>
            </div>
          )}
          <TransactionItemsEditor
            products={resource.data.products}
            items={items}
            onChange={setItems}
            enforceAvailableStock
            fieldErrors={fieldErrors}
            onClearFieldError={clearFieldError}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount" error={fieldErrors["sale-discount"]}>
              <Input
                id="sale-discount"
                aria-invalid={Boolean(fieldErrors["sale-discount"])}
                value={discount}
                onChange={(event) => {
                  clearFieldError("sale-discount");
                  setDiscount(
                    event.target.value === "" ? "" : Number(event.target.value),
                  );
                }}
                type="number"
                min="0"
                step="0.01"
              />
            </Field>
            <Field label="VAT" error={fieldErrors["sale-vat"]}>
              <Input
                id="sale-vat"
                aria-invalid={Boolean(fieldErrors["sale-vat"])}
                value={vat}
                onChange={(event) => {
                  clearFieldError("sale-vat");
                  setVat(
                    event.target.value === "" ? "" : Number(event.target.value),
                  );
                }}
                type="number"
                min="0"
                step="0.01"
              />
            </Field>
          </div>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="grid gap-3 rounded-xl bg-slate-950 p-4 text-white sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Subtotal</p>
              <p className="mt-1 font-bold">{formatMoney(subtotal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Discount</p>
              <p className="mt-1 font-bold">-{formatMoney(discountValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">VAT</p>
              <p className="mt-1 font-bold">+{formatMoney(vatValue)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total</p>
              <p className="mt-1 text-xl font-bold text-blue-300">
                {formatMoney(finalTotal)}
              </p>
            </div>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(detail) || detailLoading}
        wide
        title={detail?.sale.invoiceNumber ?? "Sale details"}
        onClose={() => setDetail(null)}
        footer={
          detail && canRecordSalePayment(user, detail.sale, detail.payments) ? (
            <Button onClick={() => void openPayment(detail.sale)}>
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
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Customer",
                    value:
                      customerNames.get(detail.sale.customerId) ??
                      detail.sale.customer?.name ??
                      detail.sale.customerId,
                  },
                  { label: "Date", value: formatDate(detail.sale.date) },
                  { label: "Total", value: formatMoney(detail.sale.total) },
                  {
                    label: "Due",
                    value: formatMoney(
                      currentSaleDue(detail.sale, detail.payments),
                    ),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-50 p-3">
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
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="p-3">
                            {item.product?.name ??
                              resource.data.products.find(
                                (product) => product.id === item.productId,
                              )?.name ??
                              item.productId}
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{formatMoney(item.unitPrice)}</td>
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
        open={Boolean(paymentSale)}
        title={`Customer payment · ${paymentSale?.invoiceNumber ?? ""}`}
        onClose={() => setPaymentSale(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentSale(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void paymentForm.handleSubmit(addPayment)()}
              disabled={
                paymentLoading ||
                Boolean(paymentError) ||
                paymentTotal <= 0 ||
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
        {paymentLoading ? (
          <LoadingState label="Loading current outstanding amount…" />
        ) : paymentError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {paymentError}
          </div>
        ) : (
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
              <Input value={formatMoney(paymentDue)} readOnly />
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
                label="Account (money in)"
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
                      {account.name} · {account.type}
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
        )}
      </Modal>
    </div>
  );
}
