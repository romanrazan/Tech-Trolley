"use client";

import Link from "next/link";
import {
  BarChart3,
  ContactRound,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { reportsService } from "@/services/reports";
import { inventoryService } from "@/services/inventory";
import { salesService } from "@/services/sales";
import { customersService } from "@/services/customers";
import { useApiData } from "@/hooks/use-api-data";
import type {
  Customer,
  DashboardStats,
  InventorySummary,
  Sale,
  SalesChartPoint,
} from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { Card, ErrorState, LoadingState } from "@/components/ui";
import { Avatar, PageHeader, StatCard, TableCell } from "@/components/page-kit";

interface DashboardData {
  stats: DashboardStats;
  inventory: InventorySummary;
  chart: SalesChartPoint[];
  sales: Sale[];
  customers: Customer[];
}
const emptyStats: DashboardStats = {
  totalSales: 0,
  totalPurchases: 0,
  totalExpenses: 0,
  totalCustomers: 0,
  totalProducts: 0,
};
const emptyInventory: InventorySummary = {
  serializedInStock: 0,
  quantityInStock: 0,
  soldUnits: 0,
  damagedUnits: 0,
};

export function DashboardPage() {
  const { user } = useAuth();
  const resource = useApiData<DashboardData>(
    async () => {
      if (!user)
        return {
          stats: emptyStats,
          inventory: emptyInventory,
          chart: [],
          sales: [],
          customers: [],
        };
      if (user.role === "SALESPERSON") {
        const [inventory, sales, customers] = await Promise.all([
          inventoryService.stock(),
          salesService.list(),
          customersService.list(),
        ]);
        const mine = sales.filter(
          (sale) =>
            sale.salespersonId === user.id && sale.status === "COMPLETED",
        );
        const grouped = new Map<string, number>();
        mine.forEach((sale) =>
          grouped.set(
            sale.date,
            (grouped.get(sale.date) ?? 0) + Number(sale.total),
          ),
        );
        return {
          stats: {
            ...emptyStats,
            totalSales: mine.reduce((sum, sale) => sum + Number(sale.total), 0),
            totalCustomers: customers.length,
          },
          inventory,
          chart: [...grouped]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, total]) => ({ date, total })),
          sales: mine,
          customers,
        };
      }
      const [stats, inventory, chart, sales, customers] = await Promise.all([
        reportsService.dashboard(),
        inventoryService.stock(),
        reportsService.salesChart(),
        salesService.list(),
        customersService.list(),
      ]);
      return { stats, inventory, chart, sales, customers };
    },
    {
      stats: emptyStats,
      inventory: emptyInventory,
      chart: [],
      sales: [],
      customers: [],
    },
  );

  if (resource.loading)
    return <LoadingState label="Preparing your dashboard…" />;
  if (resource.error)
    return <ErrorState message={resource.error} onRetry={resource.reload} />;
  const { stats, inventory, chart, sales, customers } = resource.data;
  const salesperson = user?.role === "SALESPERSON";
  const customerNames = new Map(
    customers.map((customer) => [customer.id, customer.name]),
  );
  const recentSales = [...sales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  const served = new Set(sales.map((sale) => sale.customerId)).size;
  const pie = [
    {
      name: "Serialized in stock",
      value: inventory.serializedInStock,
      color: "#0b63f6",
    },
    {
      name: "Quantity in stock",
      value: inventory.quantityInStock,
      color: "#07a2c4",
    },
    { name: "Sold units", value: inventory.soldUnits, color: "#08a76b" },
    //{ name: "Damaged units", value: inventory.damagedUnits, color: "#f79009" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          salesperson
            ? `Welcome back, ${user?.name}. Here is your sales workspace.`
            : `Good day, ${user?.name}. Here is what is happening with your business.`
        }
        actions={
          <>
            <Link
            href="/sales"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4" />
              New sale
            </Link>
            {!salesperson && (
              <Link
                href="/purchases"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500 bg-white px-4 text-sm font-semibold text-cyan-600 hover:bg-cyan-50"
              >
                <ShoppingBag className="h-4 w-4" />
                New purchase
              </Link>
            )}
          </>
        }
      />

      {salesperson ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="My completed sales"
            value={formatMoney(stats.totalSales)}
            icon={WalletCards}
          />
          <StatCard
            label="My sale count"
            value={sales.length}
            icon={ShoppingCart}
            tone="cyan"
          />
          <StatCard
            label="Customers served"
            value={served}
            icon={UsersRound}
            tone="green"
          />
          <StatCard
            label="Total customers"
            value={stats.totalCustomers}
            icon={ContactRound}
            tone="violet"
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            label="Total sales"
            value={formatMoney(stats.totalSales)}
            icon={BarChart3}
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
            tone="green"
          />
          <StatCard
            label="Total products"
            value={stats.totalProducts}
            icon={Package}
            tone="violet"
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                {salesperson ? "My sales by date" : "Sales by date"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Up to 30 returned rows
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chart.map((point) => ({
                  ...point,
                  total: Number(point.total),
                }))}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b63f6" stopOpacity={0.28} />
                    <stop
                      offset="100%"
                      stopColor="#0b63f6"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8edf5" vertical={false} />
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
                  width={48}
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
                  fill="url(#salesFill)"
                  dot={{
                    r: 3,
                    fill: "white",
                    stroke: "#0b63f6",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Inventory status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {pie.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => Number(value).toLocaleString()}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>




      <div className="mt-4 grid gap-4 xl:grid-cols-[.75fr_1.45fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent customers</h2>
            <Link
              href="/customers"
              className="text-sm font-semibold text-blue-600"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {customers
              .slice(-5)
              .reverse()
              .map((customer, index) => (
                <div key={customer.id} className="flex items-center gap-3">
                  <Avatar
                    name={customer.name}
                    color={
                      (["blue", "green", "orange", "violet"] as const)[
                        index % 4
                      ]
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {customer.name}
                    </p>
                    <p className="text-xs text-slate-400">{customer.phone}</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent sales</h2>
            <Link href="/sales" className="text-sm font-semibold text-blue-600">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="border-y border-slate-100 bg-slate-50">
                <tr>
                  {["Invoice", "Customer", "Sale date", "Total", "Status"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <TableCell className="font-semibold text-blue-600">
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {customerNames.get(sale.customerId) ?? "Customer"}
                    </TableCell>
                    <TableCell>{formatDate(sale.createdAt, true)}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {formatMoney(sale.total)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-emerald-600">
                        {sale.status}
                      </span>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Capabilities Card: Owner & Manager */}
      {/*
        <Card className="mt-4 p-5">
          <h2 className="font-bold text-slate-900">
            {user?.role === "OWNER"
              ? "Owner capabilities"
              : "Manager capabilities"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Package, text: "Manage catalog" },
              { icon: Truck, text: "Manage suppliers" },
              { icon: ShoppingBag, text: "Manage purchases" },
              { icon: ReceiptText, text: "Manage expenses" },
              { icon: ShoppingCart, text: "Sales and payments" },
              { icon: WalletCards, text: "Financial accounts" },
              { icon: BarChart3, text: "View reports" },
              {
                icon: Store,
                text:
                  user?.role === "OWNER"
                    ? "Update shop settings"
                    : "View shop settings",
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700"
              >
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </Card>
        
      )}
      
       */}
    </div>
    
  );
}
