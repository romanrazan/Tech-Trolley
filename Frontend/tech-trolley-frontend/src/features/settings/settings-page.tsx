"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { shopService } from "@/services/shop";
import { shopSchema, type ShopFormValues } from "@/schemas";
import { useApiData } from "@/hooks/use-api-data";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/client";
import type { Shop } from "@/types";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
  Textarea,
} from "@/components/ui";
import { PageHeader } from "@/components/page-kit";
import { RoleGate } from "@/components/auth/role-gate";

const blank: Shop = {
  id: "",
  name: "",
  address: "",
  phone: "",
  currency: "BDT",
};

const currencyLabels: Record<string, string> = {
  BDT: "BDT — Bangladeshi Taka",
  USD: "USD — US Dollar",
};

function toFormValues(shop: Shop): ShopFormValues {
  return {
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    currency: shop.currency,
  };
}

export function SettingsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const resource = useApiData<Shop>(() => shopService.get(), blank);
  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { name: "", address: "", phone: "", currency: "BDT" },
  });
  useEffect(() => {
    if (resource.data.id) form.reset(toFormValues(resource.data));
  }, [resource.data, form]);
  async function submit(values: ShopFormValues) {
    try {
      const updated = await shopService.update(values);
      resource.setData(updated);
      form.reset(toFormValues(updated));
      toast.success("Shop settings saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  function discard() {
    form.reset(toFormValues(resource.data));
  }
  if (resource.loading) return <LoadingState label="Loading shop settings…" />;
  if (resource.error)
    return (
      <div>
        <PageHeader
          title="Shop settings"
          description="Read and update the business identity."
        />
        <Card>
          <ErrorState message={resource.error} onRetry={resource.reload} />
        </Card>
      </div>
    );
  return (
    <RoleGate roles={["OWNER", "MANAGER"]}>
      <div>
        <PageHeader
          title="Shop settings"
          description="Read and update the business identity."
          actions={
            <Badge tone="warning">
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5" />
                Owner only
              </span>
            </Badge>
          }
        />
        <div className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-slate-900">
                Edit shop information
              </h2>
              {isOwner && (
                <Badge
                  tone={form.formState.isDirty ? "warning" : "success"}
                >
                  {form.formState.isDirty
                    ? "Unsaved changes"
                    : "All changes saved"}
                </Badge>
              )}
            </div>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
              <Field
                label="Shop name"
                error={form.formState.errors.name?.message}
              >
                <Input {...form.register("name")} disabled={!isOwner} />
              </Field>
              <Field
                label="Address"
                error={form.formState.errors.address?.message}
              >
                <Textarea
                  {...form.register("address")}
                  disabled={!isOwner}
                  rows={4}
                />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register("phone")} disabled={!isOwner} />
              </Field>
              <Field
                label="Currency"
                error={form.formState.errors.currency?.message}
              >
                <Select {...form.register("currency")} disabled={!isOwner}>
                  <option value="BDT">BDT — Bangladeshi Taka</option>
                  <option value="USD">USD — US Dollar</option>
                </Select>
              </Field>
              {isOwner && (
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    disabled={
                      form.formState.isSubmitting || !form.formState.isDirty
                    }
                  >
                    <Save className="h-4 w-4" />
                    {form.formState.isSubmitting ? "Saving…" : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={discard}
                    disabled={
                      form.formState.isSubmitting || !form.formState.isDirty
                    }
                  >
                    <RotateCcw className="h-4 w-4" />
                    Discard changes
                  </Button>
                </div>
              )}
            </form>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="font-bold text-slate-900">Current shop record</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm font-semibold text-slate-700">Name</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {resource.data.name || "—"}
                </dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm font-semibold text-slate-700">
                  Address
                </dt>
                <dd className="whitespace-pre-line text-sm leading-6 text-slate-600">
                  {resource.data.address || "—"}
                </dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm font-semibold text-slate-700">Phone</dt>
                <dd className="text-sm text-slate-600">
                  {resource.data.phone || "—"}
                </dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm font-semibold text-slate-700">
                  Currency
                </dt>
                <dd className="text-sm text-slate-600">
                  {currencyLabels[resource.data.currency] ??
                    resource.data.currency}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
