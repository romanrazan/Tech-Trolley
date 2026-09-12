"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { namedStatusSchema, type NamedStatusFormValues } from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Brand, Category } from "@/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Pagination,
  SearchBox,
} from "@/components/ui";
import { DataTable, PageHeader, TableCell } from "@/components/page-kit";

type Row = Brand | Category;

export function SimpleCatalogPage({ kind }: { kind: "brands" | "categories" }) {
  const title = kind === "brands" ? "Brands" : "Categories";
  const singular = kind === "brands" ? "brand" : "category";
  const service = kind === "brands" ? brandsService : categoriesService;
  const { user } = useAuth();
  const canWrite = user?.role === "OWNER" || user?.role === "MANAGER";
  const resource = useApiData<Row[]>(() => service.list(), []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NamedStatusFormValues>({
    resolver: zodResolver(namedStatusSchema),
    defaultValues: { name: "", isActive: true },
  });

  const filtered = useMemo(
    () =>
      resource.data.filter((row) =>
        row.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const shown = filtered.slice((page - 1) * 10, page * 10);
  function openCreate() {
    setEditing(null);
    reset({ name: "", isActive: true });
    setModalOpen(true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    reset({ name: row.name, isActive: row.isActive });
    setModalOpen(true);
  }
  async function submit(values: NamedStatusFormValues) {
    try {
      if (editing) await service.update(editing.id, values);
      else await service.create(values);
      toast.success(
        `${title.slice(0, -1)} ${editing ? "updated" : "created"}.`,
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
      await service.remove(deleting.id);
      toast.success(`${title.slice(0, -1)} deleted.`);
      setDeleting(null);
      resource.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={`${title} help organize and manage the product catalog.`}
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add {singular}
            </Button>
          ) : undefined
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={`Search ${kind}`}
          />
          <span className="text-sm text-slate-500">
            {filtered.length} {kind}
          </span>
        </div>
        <DataTable
          headers={[title.slice(0, -1), "Status", "Actions"]}
          loading={resource.loading}
          error={resource.error}
          empty={!shown.length}
          onRetry={resource.reload}
        >
          {shown.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/70">
              <TableCell className="font-semibold text-slate-900">
                {row.name}
              </TableCell>
              <TableCell>
                <Badge tone={row.isActive ? "success" : "neutral"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                {canWrite ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(row)}
                      aria-label={`Edit ${row.name}`}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting(row)}
                      aria-label={`Delete ${row.name}`}
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
        <Pagination page={page} pages={pages} onPage={setPage} />
      </Card>
      <Modal
        open={modalOpen}
        title={`${editing ? "Edit" : "Create"} ${singular}`}
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
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <Field
            label={`${title.slice(0, -1)} name`}
            error={errors.name?.message}
          >
            <Input
              {...register("name")}
              autoFocus
              placeholder={`Enter ${singular} name`}
            />
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3">
            <span className="text-sm font-medium text-slate-700">Active</span>
            <input
              {...register("isActive")}
              type="checkbox"
              className="h-5 w-5 accent-blue-600"
            />
          </label>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${singular}?`}
        message={`This will permanently remove ${deleting?.name ?? `this ${singular}`}. The backend may reject deletion when products still use it.`}
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
