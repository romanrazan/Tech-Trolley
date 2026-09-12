"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CreditCard,
  Edit3,
  Eye,
  Plus,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { accountsService } from "@/services/accounts";
import {
  accountSchema,
  accountUpdateSchema,
  type AccountFormValues,
  type AccountUpdateFormValues,
} from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Account } from "@/types";
import { asNumber, formatMoney } from "@/utils/format";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  SearchBox,
  Select,
} from "@/components/ui";
import {
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";
import { RoleGate } from "@/components/auth/role-gate";

export function AccountsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const resource = useApiData<Account[]>(() => accountsService.list(), []);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [viewing, setViewing] = useState<Account | null>(null);
  const createForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: "Cash", accountNumber: "", balance: 0 },
  });
  const updateForm = useForm<AccountUpdateFormValues>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: {
      name: "",
      type: "Cash",
      accountNumber: "",
      isActive: true,
    },
  });
  const filtered = useMemo(
    () =>
      resource.data.filter((account) =>
        `${account.name} ${account.type} ${account.accountNumber ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const total = resource.data.reduce(
    (sum, account) => sum + asNumber(account.balance),
    0,
  );

  function openCreate() {
    setEditing(null);
    createForm.reset({ name: "", type: "Cash", accountNumber: "", balance: 0 });
    setModalOpen(true);
  }
  function openEdit(account: Account) {
    setEditing(account);
    updateForm.reset({
      name: account.name,
      type: account.type,
      accountNumber: account.accountNumber ?? "",
      isActive: account.isActive,
    });
    setModalOpen(true);
  }
  async function create(values: AccountFormValues) {
    try {
      await accountsService.create(values);
      toast.success("Account created.");
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function update(values: AccountUpdateFormValues) {
    if (!editing) return;
    try {
      await accountsService.update(editing.id, values);
      toast.success("Account updated.");
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <RoleGate roles={["OWNER", "MANAGER"]}>
      <div>
        <PageHeader
          title="Accounts"
          description="Manage business accounts, track balances, and monitor account activity."
          actions={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add account
            </Button>
          }
        />
        {/* <div className="mb-4 grid gap-3 sm:grid-cols-3"> */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
          <StatCard
            label="Total balance"
            value={formatMoney(total)}
            icon={WalletCards}
          />
          <StatCard
            label="Active accounts"
            value={resource.data.filter((a) => a.isActive).length}
            icon={CreditCard}
            tone="green"
          />
          <StatCard
            label="Account types"
            value={new Set(resource.data.map((a) => a.type)).size}
            icon={Building2}
            tone="violet"
          />
        </div>
        <Card className="mb-4 border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Managers can create and read accounts. Only owners can edit, change
          status.
        </Card>
        <Card className="overflow-hidden">
          <div className="p-4">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search by name, type or account number"
            />
          </div>
          <DataTable
            headers={[
              "Name",
              "Type",
              "Account number",
              "Balance",
              "Status",
              "Actions",
            ]}
            loading={resource.loading}
            error={resource.error}
            empty={!filtered.length}
            onRetry={resource.reload}
          >
            {filtered.map((account) => (
              <tr key={account.id} className="hover:bg-slate-50/70">
                <TableCell className="font-semibold text-slate-900">
                  {account.name}
                </TableCell>
                <TableCell>
                  <Badge tone="info">{account.type}</Badge>
                </TableCell>
                <TableCell>{account.accountNumber || "—"}</TableCell>
                <TableCell className="font-bold text-slate-900">
                  {formatMoney(account.balance)}
                </TableCell>
                <TableCell>
                  <Badge tone={account.isActive ? "success" : "neutral"}>
                    {account.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewing(account)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(account)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </tr>
            ))}
          </DataTable>
        </Card>
        <Modal
          open={modalOpen}
          title={`${editing ? "Edit" : "Create"} account`}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  void (editing
                    ? updateForm.handleSubmit(update)()
                    : createForm.handleSubmit(create)())
                }
              >
                {editing ? "Save changes" : "Create account"}
              </Button>
            </>
          }
        >
          {editing ? (
            <form
              onSubmit={updateForm.handleSubmit(update)}
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field
                label="Account name"
                error={updateForm.formState.errors.name?.message}
              >
                <Input {...updateForm.register("name")} />
              </Field>
              <Field
                label="Type"
                error={updateForm.formState.errors.type?.message}
              >
                <Select {...updateForm.register("type")}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>Mobile Wallet</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Account number (optional)"
                  error={updateForm.formState.errors.accountNumber?.message}
                >
                  <Input {...updateForm.register("accountNumber")} />
                </Field>
              </div>
              <label className="sm:col-span-2 flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-semibold">Active account</span>
                <input
                  {...updateForm.register("isActive")}
                  type="checkbox"
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
            </form>
          ) : (
            <form
              onSubmit={createForm.handleSubmit(create)}
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field
                label="Account name"
                error={createForm.formState.errors.name?.message}
              >
                <Input {...createForm.register("name")} />
              </Field>
              <Field
                label="Type"
                error={createForm.formState.errors.type?.message}
              >
                <Select {...createForm.register("type")}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>Mobile Wallet</option>
                </Select>
              </Field>
              <Field
                label="Account number (optional)"
                error={createForm.formState.errors.accountNumber?.message}
              >
                <Input {...createForm.register("accountNumber")} />
              </Field>
              <Field
                label="Opening balance"
                error={createForm.formState.errors.balance?.message}
              >
                <Input
                  {...createForm.register("balance", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                />
              </Field>
            </form>
          )}
        </Modal>
        <Modal
          open={Boolean(viewing)}
          title={viewing?.name ?? "Account"}
          onClose={() => setViewing(null)}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs text-slate-500">Balance</dt>
              <dd className="mt-1 text-2xl font-bold">
                {formatMoney(viewing?.balance)}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs text-slate-500">Type</dt>
              <dd className="mt-1 font-semibold">{viewing?.type}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Account number</dt>
              <dd className="mt-1 font-semibold">
                {viewing?.accountNumber || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd className="mt-1">
                <Badge tone={viewing?.isActive ? "success" : "neutral"}>
                  {viewing?.isActive ? "Active" : "Inactive"}
                </Badge>
              </dd>
            </div>
          </dl>
        </Modal>
      </div>
    </RoleGate>
  );
}
