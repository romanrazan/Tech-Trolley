"use client";

import { useEffect, useState } from "react";
import {
  Barcode,
  Boxes,
  CheckCircle2,
  PackageCheck,
  Search,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { z } from "zod";
import { inventoryService } from "@/services/inventory";
import { productsService } from "@/services/products";
import { useApiData } from "@/hooks/use-api-data";
import { getApiErrorMessage } from "@/lib/api/client";
import type { InventorySummary, InventoryUnit, Product } from "@/types";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
} from "@/components/ui";
import { PageHeader, StatCard } from "@/components/page-kit";

interface InventoryPageData {
  stock: InventorySummary;
  products: Product[];
}
const empty: InventorySummary = {
  serializedInStock: 0,
  quantityInStock: 0,
  soldUnits: 0,
  damagedUnits: 0,
};
const imeiSchema = z.string().trim().min(1, "Enter an IMEI number.");

export function InventoryPage() {
  const resource = useApiData<InventoryPageData>(
    async () => {
      const [stock, products] = await Promise.all([
        inventoryService.stock(),
        productsService.list(),
      ]);
      return { stock, products };
    },
    { stock: empty, products: [] },
  );
  const [imei, setImei] = useState("");
  const [imeiError, setImeiError] = useState<string | null>(null);
  const [result, setResult] = useState<InventoryUnit | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const schema = z.object({ imei: z.string().trim().min(1) });
    void Promise.resolve(
      context.registerTool(
        {
          name: "lookup_inventory_imei",
          title: "Look up inventory IMEI",
          description:
            "Look up one serialized device by IMEI and show the same result in the Tech Trolley inventory page.",
          inputSchema: {
            type: "object",
            properties: { imei: { type: "string", minLength: 1 } },
            required: ["imei"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          async execute(input) {
            const parsed = schema.parse(input);
            setImei(parsed.imei);
            setImeiError(null);
            try {
              const unit = await inventoryService.imei(parsed.imei);
              setResult(unit);
              return {
                id: unit.id,
                imei: unit.imei,
                productId: unit.productId,
                productName: unit.product?.name,
                status: unit.status,
                quantity: unit.quantity,
              };
            } catch (error) {
              const message = getApiErrorMessage(error);
              setResult(null);
              setImeiError(message);
              throw new Error(message);
            }
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch((error: unknown) =>
      console.error("WebMCP tool registration failed", error),
    );
    return () => lifecycle.abort();
  }, []);
  if (resource.loading) return <LoadingState label="Reading inventory…" />;
  if (resource.error)
    return <ErrorState message={resource.error} onRetry={resource.reload} />;
  const { stock, products } = resource.data;
  const total =
    stock.serializedInStock +
    stock.quantityInStock +
    stock.soldUnits;
  const chart = [
    { name: "Serialized", value: stock.serializedInStock, color: "#0b63f6" },
    { name: "Quantity", value: stock.quantityInStock, color: "#08a6c8" },
    { name: "Sold", value: stock.soldUnits, color: "#08a76b" },
  ];

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setImeiError(null);
    setResult(null);
    const parsed = imeiSchema.safeParse(imei);
    if (!parsed.success) {
      setImeiError(parsed.error.issues[0]?.message ?? "Enter an IMEI.");
      return;
    }
    setSearching(true);
    try {
      setResult(await inventoryService.imei(parsed.data));
    } catch (error) {
      setImeiError(getApiErrorMessage(error));
    } finally {
      setSearching(false);
    }
  }
  const resultProduct = result
    ? (result.product ??
      products.find((product) => product.id === result.productId))
    : undefined;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Monitor stock levels, sold units, and serialized devices in one place."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Serialized in stock"
          value={stock.serializedInStock}
          icon={Barcode}
          tone="cyan"
        />
        <StatCard
          label="Quantity in stock"
          value={stock.quantityInStock}
          icon={Boxes}
        />
        <StatCard
          label="Sold units"
          value={stock.soldUnits}
          icon={PackageCheck}
          tone="green"
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Inventory overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            View current stock levels and sold units at a glance.
          </p>
          <div className="mt-6 space-y-5">
            {chart.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${total ? Math.max(2, (item.value / total) * 100) : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Inventory distribution</h2>
          <div className="relative h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chart}
                  dataKey="value"
                  innerRadius={72}
                  outerRadius={100}
                >
                  {chart.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => Number(value).toLocaleString()}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-xs text-slate-400">Total units</p>
                <p className="text-3xl font-bold text-slate-950">{total}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Search className="h-5 w-5 text-blue-600" />
              Look up an IMEI
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Find detailed inventory information for any serialized device.
            </p>
            <form
              onSubmit={lookup}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                value={imei}
                onChange={(event) => setImei(event.target.value)}
                placeholder="Enter IMEI number"
                className="flex-1"
              />
              <Button disabled={searching}>
                {searching ? "Checking…" : "Check IMEI"}
              </Button>
            </form>
            {imeiError && (
              <p className="mt-2 text-sm text-red-600">{imeiError}</p>
            )}
          </div>
          {result && (
            <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 lg:max-w-xl">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  IMEI found
                </p>
                <Badge
                  tone={
                    result.status === "IN_STOCK"
                      ? "success"
                      : result.status === "SOLD"
                        ? "info"
                        : "danger"
                  }
                >
                  {result.status.replace("_", " ")}
                </Badge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Product</dt>
                  <dd className="font-semibold text-slate-900">
                    {resultProduct?.name ?? "Unknown product"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tracking</dt>
                  <dd className="font-semibold text-slate-900">
                    {resultProduct?.trackingType === "SERIALIZED"
                      ? "Serialized / IMEI"
                      : "Quantity"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Purchase</dt>
                  <dd className="font-medium text-slate-700">
                    {result.purchaseId ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Sale</dt>
                  <dd className="font-medium text-slate-700">
                    {result.saleId ?? "Not sold"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
