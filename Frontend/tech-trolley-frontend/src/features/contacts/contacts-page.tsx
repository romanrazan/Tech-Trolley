"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Edit3, Eye, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { customerSchema, supplierSchema } from "@/schemas";
import { customersService } from "@/services/customers";
import { suppliersService } from "@/services/suppliers";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type {
  Customer,
  CustomerDetails,
  Supplier,
  SupplierDetails,
} from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import {
  Button,
  Badge,
  Card,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  SearchBox,
  Textarea,
} from "@/components/ui";
import {
  Avatar,
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";
import { ContactRound, HandCoins, Truck } from "lucide-react";

type Contact = Customer | Supplier;
type ContactValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
};
interface ContactWithDue {
  record: Contact;
  due: number;
}

export function ContactsPage({ kind }: { kind: "customers" | "suppliers" }) {
  const isCustomer = kind === "customers";
  const title = isCustomer ? "Customers" : "Suppliers";
  const singular = isCustomer ? "customer" : "supplier";
  const { user } = useAuth();
  const canWrite =
    isCustomer || user?.role === "OWNER" || user?.role === "MANAGER";
  const resource = useApiData<ContactWithDue[]>(async () => {
    if (isCustomer) {
      const records = await customersService.list();
      return records.map((record) => ({
        record,
        due: record.due ?? 0,
      }));
    }

    const records = await suppliersService.list();
    return records.map((record) => ({
      record,
      due: record.due ?? 0,
    }));
  }, []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] =
    useState<CustomerDetails | null>(null);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [supplierDetails, setSupplierDetails] =
    useState<SupplierDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  const filtered = useMemo(
    () =>
      resource.data.filter(({ record }) =>
        `${record.name} ${record.phone} ${record.email ?? ""} ${record.address ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((page - 1) * 10, page * 10);
  const totalDue = resource.data.reduce((sum, item) => sum + item.due, 0);
  const withDue = resource.data.filter((item) => item.due > 0).length;
  function openEdit(record: Contact) {
    setEditing(record);
    clearErrors();
    reset({
      name: record.name,
      phone: record.phone,
      email: record.email ?? "",
      address: record.address ?? "",
    });
    setModalOpen(true);
  }
  async function openCustomerDetails(customer: Customer) {
    setDetailCustomer(customer);
    setCustomerDetails(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setCustomerDetails(await customersService.details(customer.id));
    } catch (error) {
      setDetailError(getApiErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }
  async function openSupplierDetails(supplier: Supplier) {
    setDetailSupplier(supplier);
    setSupplierDetails(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setSupplierDetails(await suppliersService.details(supplier.id));
    } catch (error) {
      setDetailError(getApiErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }
  async function submit(values: ContactValues) {
    const parsed = (isCustomer ? customerSchema : supplierSchema).safeParse(
      values,
    );
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string")
          setError(field as keyof ContactValues, { message: issue.message });
      });
      return;
    }
    try {
      if (isCustomer) {
        if (!editing) return;
        const payload = {
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          address: values.address || undefined,
        };
        await customersService.update(editing.id, payload);
      } else {
        if (!editing) return;
        const payload = {
          name: values.name,
          phone: values.phone,
          email: values.email,
          address: values.address,
        };
        await suppliersService.update(editing.id, payload);
      }
      toast.success(
        `${title.slice(0, -1)} ${editing ? "updated" : "created"}.`,
      );
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div>
      <PageHeader
        title={title}
        description={
           isCustomer
           ? "Manage customer details and track outstanding balances."
           : "Manage supplier details and track outstanding balances."
          }

      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label={`Total ${kind}`}
          value={resource.data.length}
          icon={isCustomer ? ContactRound : Truck}
        />
        <StatCard
          label={`With outstanding due`}
          value={withDue}
          icon={HandCoins}
          tone="orange"
        />
        <StatCard
          label="Total due amount"
          value={formatMoney(totalDue)}
          icon={HandCoins}
          tone={totalDue > 0 ? "red" : "green"}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={`Search ${kind} by name, phone or email`}
          />
          <span className="text-sm text-slate-500">
            {filtered.length} records
          </span>
        </div>
        <DataTable
          headers={["Name", "Contact", "Address", "Due", "Actions"]}
          loading={resource.loading}
          error={resource.error}
          empty={!shown.length}
          onRetry={resource.reload}
        >
          {shown.map(({ record, due }, index) => (
            <tr key={record.id} className="hover:bg-slate-50/70">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={record.name}
                    color={
                      (["blue", "green", "orange", "violet"] as const)[
                        index % 4
                      ]
                    }
                  />
                  <span className="font-semibold text-slate-900">
                    {record.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {record.phone}
                </p>
                {record.email && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-600">
                    <Mail className="h-3.5 w-3.5" />
                    {record.email}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <span className="flex max-w-xs items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {record.address || "—"}
                </span>
              </TableCell>
              <TableCell
                className={`font-bold ${due > 0 ? "text-red-600" : "text-emerald-600"}`}
              >
                {formatMoney(due)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isCustomer
                        ? void openCustomerDetails(record as Customer)
                        : void openSupplierDetails(record as Supplier)
                    }
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(record)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  {!canWrite && !isCustomer && (
                    <span className="text-xs text-slate-400">Read only</span>
                  )}
                </div>
              </TableCell>
            </tr>
          ))}
        </DataTable>
        <Pagination page={page} pages={pages} onPage={setPage} />
      </Card>
      <Modal
        open={modalOpen}
        title={`Edit ${singular}`}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit(submit)()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit(submit)}
          className="grid gap-5 sm:grid-cols-2"
          noValidate
        >
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} autoFocus />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <Field
            label={`Email${isCustomer ? " (optional)" : ""}`}
            error={errors.email?.message}
          >
            <Input {...register("email")} type="email" />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label={`Address${isCustomer ? " (optional)" : ""}`}
              error={errors.address?.message}
            >
              <Textarea {...register("address")} rows={3} />
            </Field>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(detailCustomer)}
        wide
        title={
          customerDetails?.customer.name ??
          detailCustomer?.name ??
          "Customer details"
        }
        description="Customer profile, backend-calculated totals, and complete sales history."
        onClose={() => {
          setDetailCustomer(null);
          setCustomerDetails(null);
          setDetailError(null);
        }}
      >
        {detailLoading ? (
          <LoadingState label="Loading customer history…" />
        ) : detailError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{detailError}</p>
            <Button
              className="mt-3"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (detailCustomer) void openCustomerDetails(detailCustomer);
              }}
            >
              Try again
            </Button>
          </div>
        ) : customerDetails ? (
          <div className="space-y-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Name</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {customerDetails.customer.name}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {customerDetails.customer.phone}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="mt-1 break-words font-semibold text-slate-900">
                  {customerDetails.customer.email || "—"}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="mt-1 break-words font-semibold text-slate-900">
                  {customerDetails.customer.address || "—"}
                </dd>
              </div>
            </dl>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total sales"
                value={formatMoney(customerDetails.summary.totalSales)}
                icon={HandCoins}
              />
              <StatCard
                label="Total paid"
                value={formatMoney(customerDetails.summary.totalPaid)}
                icon={HandCoins}
                tone="green"
              />
              <StatCard
                label="Outstanding due"
                value={formatMoney(customerDetails.summary.totalDue)}
                icon={HandCoins}
                tone={customerDetails.summary.totalDue > 0 ? "red" : "green"}
              />
            </div>

            <div>
              <h3 className="mb-2 font-bold text-slate-900">Sales history</h3>
              {customerDetails.sales.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Invoice</th>
                        <th className="p-3">Products / IMEIs</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit price</th>
                        <th className="p-3">Sale total</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.sales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="p-3">{formatDate(sale.date)}</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">
                              {sale.invoiceNumber}
                            </p>
                            <Badge
                              tone={
                                sale.status === "COMPLETED"
                                  ? "success"
                                  : sale.status === "INCOMPLETE"
                                    ? "warning"
                                    : sale.status === "RETURNED"
                                      ? "danger"
                                      : "info"
                              }
                            >
                              {sale.status.replaceAll("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {sale.items.map((item) => (
                                <div key={item.id}>
                                  <p className="font-medium text-slate-900">
                                    {item.productName}
                                  </p>
                                  {item.imeis.length > 0 && (
                                    <p className="mt-0.5 break-all text-xs text-slate-500">
                                      IMEI: {item.imeis.join(", ")}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {sale.items.map((item) => (
                                <p key={item.id}>{item.quantity}</p>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {sale.items.map((item) => (
                                <p key={item.id}>
                                  {formatMoney(item.unitPrice)}
                                </p>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-semibold">
                            {formatMoney(sale.total)}
                          </td>
                          <td className="p-3">
                            {formatMoney(sale.paidAmount)}
                          </td>
                          <td className="p-3 font-semibold text-red-600">
                            {formatMoney(sale.remainingDue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  This customer has no sales yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(detailSupplier)}
        wide
        title={
          supplierDetails?.supplier.name ??
          detailSupplier?.name ??
          "Supplier details"
        }
        description="Supplier profile, backend-calculated totals, and paid purchase history."
        onClose={() => {
          setDetailSupplier(null);
          setSupplierDetails(null);
          setDetailError(null);
        }}
      >
        {detailLoading ? (
          <LoadingState label="Loading supplier history…" />
        ) : detailError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{detailError}</p>
            <Button
              className="mt-3"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (detailSupplier) void openSupplierDetails(detailSupplier);
              }}
            >
              Try again
            </Button>
          </div>
        ) : supplierDetails ? (
          <div className="space-y-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Name", supplierDetails.supplier.name],
                ["Phone", supplierDetails.supplier.phone],
                ["Email", supplierDetails.supplier.email],
                ["Address", supplierDetails.supplier.address],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-900">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total purchases"
                value={formatMoney(supplierDetails.summary.totalPurchases)}
                icon={HandCoins}
              />
              <StatCard
                label="Total paid"
                value={formatMoney(supplierDetails.summary.totalPaid)}
                icon={HandCoins}
                tone="green"
              />
              <StatCard
                label="Outstanding due"
                value={formatMoney(supplierDetails.summary.totalDue)}
                icon={HandCoins}
                tone={supplierDetails.summary.totalDue > 0 ? "red" : "green"}
              />
            </div>
            <div>
              <h3 className="mb-2 font-bold text-slate-900">
                Purchase history
              </h3>
              {supplierDetails.purchases.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[1250px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="p-3">Date / Invoice</th>
                        <th className="p-3">Products / IMEIs</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Unit price</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Due</th>
                        <th className="p-3">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierDetails.purchases.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="p-3">
                            <p>{formatDate(purchase.date)}</p>
                            <p className="font-semibold text-slate-900">
                              {purchase.invoiceNumber}
                            </p>
                            <Badge
                              tone={
                                purchase.status === "COMPLETED"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {purchase.status.replaceAll("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {purchase.items.map((item) => (
                              <div key={item.id} className="mb-2 last:mb-0">
                                <p className="font-medium">
                                  {item.productName}
                                </p>
                                {item.imeis.length > 0 && (
                                  <p className="break-all text-xs text-slate-500">
                                    IMEI: {item.imeis.join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </td>
                          <td className="p-3">
                            {purchase.items.map((item) => (
                              <p key={item.id}>{item.quantity}</p>
                            ))}
                          </td>
                          <td className="p-3">
                            {purchase.items.map((item) => (
                              <p key={item.id}>{formatMoney(item.unitPrice)}</p>
                            ))}
                          </td>
                          <td className="p-3 font-semibold">
                            {formatMoney(purchase.total)}
                          </td>
                          <td className="p-3">
                            {formatMoney(purchase.paidAmount)}
                          </td>
                          <td className="p-3 font-semibold text-red-600">
                            {formatMoney(purchase.remainingDue)}
                          </td>
                          <td className="p-3">
                            {purchase.payments.map((payment) => (
                              <p key={payment.id} className="mb-1 last:mb-0">
                                {payment.paymentMethod} ·{" "}
                                {formatDate(payment.date)}
                                <br />
                                <span className="font-medium">
                                  {formatMoney(payment.amount)}
                                </span>
                              </p>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  This supplier has no paid purchases yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
