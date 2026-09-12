"use client";

import {
  BarChart3,
  ContactRound,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsService } from "@/services/reports";
import { useApiData } from "@/hooks/use-api-data";
import type { DashboardStats, SalesChartPoint } from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { Card, ErrorState, LoadingState } from "@/components/ui";
import { PageHeader, StatCard } from "@/components/page-kit";
import { RoleGate } from "@/components/auth/role-gate";

interface ReportData {
  stats: DashboardStats;
  chart: SalesChartPoint[];
}
const empty: DashboardStats = {
  totalSales: 0,
  totalPurchases: 0,
  totalExpenses: 0,
  totalCustomers: 0,
  totalProducts: 0,
};

export function ReportsPage() {
  const resource = useApiData<ReportData>(
    async () => {
      const [stats, chart] = await Promise.all([
        reportsService.dashboard(),
        reportsService.salesChart(),
      ]);
      return { stats, chart };
    },
    { stats: empty, chart: [] },
  );
  if (resource.loading) return <LoadingState label="Generating reports…" />;
  if (resource.error)
    return <ErrorState message={resource.error} onRetry={resource.reload} />;
  const { stats, chart } = resource.data;
  const grossMargin =
    stats.totalSales - stats.totalPurchases - stats.totalExpenses;
  return (
    <RoleGate roles={["OWNER", "MANAGER"]}>
      <div>
        <PageHeader
          title="Reports"
          description="Review sales, purchases, expenses, customers, and overall business performance."
          eyebrow="Live reporting"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total sales"
            value={formatMoney(stats.totalSales)}
            icon={ShoppingCart}
          />
          <StatCard
            label="Total purchases"
            value={formatMoney(stats.totalPurchases)}
            icon={ShoppingBag}
            tone="cyan"
          />
          <StatCard
            label="Total expenses"
            value={formatMoney(stats.totalExpenses)}
            icon={ReceiptText}
            tone="orange"
          />
          <StatCard
            label="Total customers"
            value={stats.totalCustomers}
            icon={ContactRound}
            tone="violet"
          />
          <StatCard
            label="Total products"
            value={stats.totalProducts}
            icon={Package}
            tone="green"
          />
        </div>
        <Card className="mt-4 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h2 className="font-bold text-slate-900">Sales by date</h2>
              <p className="mt-1 text-sm text-slate-500">
                View sales totals grouped by date for the latest available records.
              </p>
            </div>
            <div
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${grossMargin >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
            >
              Sales − purchases − expenses: {formatMoney(grossMargin)}
            </div>
          </div>
          <div className="mt-6 h-[390px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chart.map((item) => ({
                  ...item,
                  total: Number(item.total),
                }))}
              >
                <defs>
                  <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b63f6" stopOpacity={0.25} />
                    <stop
                      offset="100%"
                      stopColor="#0b63f6"
                      stopOpacity={0.015}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e7edf5" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    formatDate(value).replace(/, \d{4}/, "")
                  }
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `৳${Math.round(value / 1000)}K`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  labelFormatter={(value) => formatDate(String(value))}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0b63f6"
                  strokeWidth={3}
                  fill="url(#reportFill)"
                  dot={{ r: 3, fill: "#0b63f6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="mt-4 flex items-start gap-3 border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong>Report scope:</strong> View overall business totals and sales grouped by date. Profit, returns, and stock history reports are currently unavailable.
          </p>
        </Card>
      </div>
    </RoleGate>
  );
}
