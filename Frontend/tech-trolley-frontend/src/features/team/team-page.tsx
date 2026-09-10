"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit3,
  Plus,
  Power,
  Trash2,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { usersService } from "@/services/users";
import {
  userSchema,
  userUpdateSchema,
  type UserFormValues,
  type UserUpdateFormValues,
} from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type { User } from "@/types";
import { formatDate } from "@/utils/format";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  SearchBox,
  Select,
} from "@/components/ui";
import {
  Avatar,
  DataTable,
  PageHeader,
  StatCard,
  TableCell,
} from "@/components/page-kit";
import { RoleGate } from "@/components/auth/role-gate";

export function TeamPage() {
  const { user: activeUser } = useAuth();
  const isOwner = activeUser?.role === "OWNER";
  const resource = useApiData<User[]>(() => usersService.list(), []);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "SALESPERSON",
      isActive: true,
    },
  });
  const updateForm = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: { name: "", email: "", role: "SALESPERSON" },
  });
  const filtered = useMemo(
    () =>
      resource.data.filter((user) =>
        `${user.name} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  function openCreate() {
    setEditing(null);
    createForm.reset({
      name: "",
      email: "",
      password: "",
      role: "SALESPERSON",
      isActive: true,
    });
    setModalOpen(true);
  }
  function openEdit(user: User) {
    setEditing(user);
    updateForm.reset({ name: user.name, email: user.email, role: user.role });
    setModalOpen(true);
  }
  async function create(values: UserFormValues) {
    try {
      await usersService.create(values);
      toast.success("Team member created.");
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function update(values: UserUpdateFormValues) {
    if (!editing) return;
    try {
      await usersService.update(editing.id, values);
      toast.success("Team member updated.");
      setModalOpen(false);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function toggle(user: User) {
    if (user.id === activeUser?.id) {
      toast.error(
        "You cannot deactivate your current session from this screen.",
      );
      return;
    }
    try {
      await usersService.setStatus(user.id, !user.isActive);
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}.`);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await usersService.remove(deleting.id);
      toast.success("Team member deleted.");
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
          title="Team"
          description={
            isOwner
              ? "Create users, assign roles and control account access."
              : "Review the team. User management is reserved for the owner."
          }
          actions={
            isOwner ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add user
              </Button>
            ) : undefined
          }
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Team members"
            value={resource.data.length}
            icon={UsersRound}
          />
          <StatCard
            label="Active users"
            value={resource.data.filter((u) => u.isActive).length}
            icon={UserCheck}
            tone="green"
          />
          <StatCard
            label="Salespeople"
            value={resource.data.filter((u) => u.role === "SALESPERSON").length}
            icon={UsersRound}
            tone="violet"
          />
        </div>
        <Card className="overflow-hidden">
          <div className="p-4">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search team members"
            />
          </div>
          <DataTable
            headers={["User", "Role", "Status", "Created", "Actions"]}
            loading={resource.loading}
            error={resource.error}
            empty={!filtered.length}
            onRetry={resource.reload}
          >
            {filtered.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-50/70">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user.name}
                      color={
                        (["blue", "green", "orange", "violet"] as const)[
                          index % 4
                        ]
                      }
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    tone={
                      user.role === "OWNER"
                        ? "violet"
                        : user.role === "MANAGER"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge tone={user.isActive ? "success" : "danger"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  {isOwner ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void toggle(user)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={user.id === activeUser?.id}
                        onClick={() => setDeleting(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Read only</span>
                  )}
                </TableCell>
              </tr>
            ))}
          </DataTable>
        </Card>
        <Modal
          open={modalOpen}
          title={`${editing ? "Edit" : "Create"} team member`}
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
                {editing ? "Save changes" : "Create user"}
              </Button>
            </>
          }
        >
          {editing ? (
            <form
              onSubmit={updateForm.handleSubmit(update)}
              className="space-y-5"
            >
              <Field
                label="Full name"
                error={updateForm.formState.errors.name?.message}
              >
                <Input {...updateForm.register("name")} />
              </Field>
              <Field
                label="Email"
                error={updateForm.formState.errors.email?.message}
              >
                <Input {...updateForm.register("email")} type="email" />
              </Field>
              <Field
                label="Role"
                error={updateForm.formState.errors.role?.message}
              >
                <Select {...updateForm.register("role")}>
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SALESPERSON">Salesperson</option>
                </Select>
              </Field>
            </form>
          ) : (
            <form
              onSubmit={createForm.handleSubmit(create)}
              className="space-y-5"
            >
              <Field
                label="Full name"
                error={createForm.formState.errors.name?.message}
              >
                <Input {...createForm.register("name")} />
              </Field>
              <Field
                label="Email"
                error={createForm.formState.errors.email?.message}
              >
                <Input {...createForm.register("email")} type="email" />
              </Field>
              <Field
                label="Temporary password"
                error={createForm.formState.errors.password?.message}
              >
                <Input {...createForm.register("password")} type="password" />
              </Field>
              <Field
                label="Role"
                error={createForm.formState.errors.role?.message}
              >
                <Select {...createForm.register("role")}>
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SALESPERSON">Salesperson</option>
                </Select>
              </Field>
              <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-semibold">Active user</span>
                <input
                  {...createForm.register("isActive")}
                  type="checkbox"
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
            </form>
          )}
        </Modal>
        <ConfirmDialog
          open={Boolean(deleting)}
          title="Delete team member?"
          message={`This permanently removes ${deleting?.name ?? "this user"}. Existing sales linked to the user may prevent deletion.`}
          loading={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      </div>
    </RoleGate>
  );
}
