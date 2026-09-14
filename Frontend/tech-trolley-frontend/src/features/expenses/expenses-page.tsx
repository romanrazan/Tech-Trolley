"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Edit3,
  PieChart as PieIcon,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { expensesService } from "@/services/expenses";
import { accountsService } from "@/services/accounts";
import { expenseSchema, type ExpenseFormValues } from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Account, Expense } from "@/types";
import { asNumber, formatDate, formatMoney, today } from "@/utils/format";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
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

interface ExpenseData {
  expenses: Expense[];
  accounts: Account[];
}
const colors = [
  "#0b63f6",
  "#08a76b",
  "#f79009",
  "#8b5cf6",
  "#06a6c7",
  "#e5484d",
];

export function ExpensesPage() {
  const resource = useApiData<ExpenseData>(
    async () => {
      const [expenses, accounts] = await Promise.all([
        expensesService.list(),
        accountsService.list(),
      ]);
      return { expenses, accounts };
    },
    { expenses: [], accounts: [] },
  );
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: undefined,
      accountId: "",
      date: today(),
      remarks: "",
    },
  });
  const accountNames = useMemo(
    () =>
      new Map(
        resource.data.accounts.map((account) => [account.id, account.name]),
      ),
    [resource.data.accounts],
  );
  const filtered = useMemo(
    () =>
      resource.data.expenses.filter((expense) =>
        `${expense.category} ${expense.remarks ?? ""} ${accountNames.get(expense.accountId) ?? expense.account?.name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data.expenses, search, accountNames],
  );
  const total = resource.data.expenses.reduce(
    (sum, item) => sum + asNumber(item.amount),
    0,
  );
  const currentMonth = today().slice(0, 7);
  const monthTotal = resource.data.expenses
    .filter((item) => item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + asNumber(item.amount), 0);
  const byCategory = Object.entries(
    resource.data.expenses.reduce<Record<string, number>>((groups, expense) => {
      groups[expense.category] =
        (groups[expense.category] ?? 0) + asNumber(expense.amount);
      return groups;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
  const byMonth = Object.entries(
    resource.data.expenses.reduce<Record<string, number>>((groups, expense) => {
      const key = expense.date.slice(0, 7);
      groups[key] = (groups[key] ?? 0) + asNumber(expense.amount);
      return groups;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  function openCreate() {
    setEditing(null);
    form.reset({
      category: "",
      amount: undefined,
      accountId:
        resource.data.accounts.find((account) => account.isActive)?.id ?? "",
      date: today(),
      remarks: "",
    });
    setModalOpen(true);
  }
  function openEdit(expense: Expense) {
    setEditing(expense);
    form.reset({
      category: expense.category,
      amount: asNumber(expense.amount),
      accountId: expense.accountId,
      date: expense.date,
      remarks: expense.remarks ?? "",
    });
    setModalOpen(true);
  }
  async function submit(values: ExpenseFormValues) {
    try {
      if (editing) await expensesService.update(editing.id, values);
      else await expensesService.create(values);
      toast.success(
        `Expense ${editing ? "updated" : "created"}; account balance was adjusted.`,
      );
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await expensesService.remove(deleting.id);
      toast.success("Expense deleted and its account balance refunded.");
      setDeleting(null);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <RoleGate roles={["OWNER", "MANAGER"]}>
      <div>
        <PageHeader
          title="Expenses"
          description="Record business expenses, track spending, and monitor account balances."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total expenses"
            value={formatMoney(total)}
            icon={ReceiptText}
          />
          <StatCard
            label="This month"
            value={formatMoney(monthTotal)}
            icon={CalendarDays}
            tone="green"
          />
          <StatCard
            label="Largest category"
            value={byCategory.sort((a, b) => b.value - a.value)[0]?.name ?? "—"}
            icon={PieIcon}
            tone="orange"
          />
          <StatCard
            label="Active accounts"
            value={
              resource.data.accounts.filter((account) => account.isActive)
                .length
            }
            icon={WalletCards}
            tone="violet"
          />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
          <Card className="p-5">
            <h2 className="font-bold">Monthly expenses</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byMonth}>
                  <defs>
                    <linearGradient
                      id="expenseFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0b63f6"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="100%"
                        stopColor="#0b63f6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e8edf5" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `৳${Math.round(v / 1000)}K`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0b63f6"
                    strokeWidth={2.5}
                    fill="url(#expenseFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold">Expenses by category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={82}
                  >
                    {byCategory.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="mt-4 overflow-hidden">
          <div className="p-4">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search expenses, accounts or remarks"
            />
          </div>
          <DataTable
            headers={[
              "Category",
              "Date",
              "Amount",
              "Account",
              "Remarks",
              "Actions",
            ]}
            loading={resource.loading}
            error={resource.error}
            empty={!filtered.length}
            onRetry={resource.reload}
          >
            {filtered.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50/70">
                <TableCell className="font-semibold text-slate-900">
                  {expense.category}
                </TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="font-bold text-red-600">
                  {formatMoney(expense.amount)}
                </TableCell>
                <TableCell>
                  {accountNames.get(expense.accountId) ??
                    expense.account?.name ??
                    expense.accountId.slice(0, 8)}
                </TableCell>
                <TableCell>{expense.remarks || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(expense)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </tr>
            ))}
          </DataTable>
        </Card>
        <Modal
          open={modalOpen}
          title={`${editing ? "Edit" : "Add"} expense`}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void form.handleSubmit(submit)()}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add expense"}
              </Button>
            </>
          }
        >
          <form
            onSubmit={form.handleSubmit(submit)}
            className="grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Category"
              error={form.formState.errors.category?.message}
            >
              <Input {...form.register("category")} placeholder="Rent" />
            </Field>
            <Field label="Amount" error={form.formState.errors.amount?.message}>
              <Input
                {...form.register("amount", {
                  setValueAs: (value: string) =>
                    value === "" ? Number.NaN : Number(value),
                })}
                type="number"
                min="0.01"
                step="0.01"
              />
            </Field>
            <Field
              label="Account"
              error={form.formState.errors.accountId?.message}
            >
              <Select {...form.register("accountId")}>
                <option value="">Select account</option>
                {resource.data.accounts
                  .filter(
                    (account) =>
                      account.isActive || account.id === editing?.accountId,
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {formatMoney(account.balance)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Date" error={form.formState.errors.date?.message}>
              <Input {...form.register("date")} type="date" />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Remarks (optional)"
                error={form.formState.errors.remarks?.message}
              >
                <Textarea {...form.register("remarks")} rows={3} />
              </Field>
            </div>
          </form>
        </Modal>
        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete expense?"
          message="The backend will remove this expense and refund the recorded amount to its financial account."
          loading={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      </div>
    </RoleGate>
  );
}
