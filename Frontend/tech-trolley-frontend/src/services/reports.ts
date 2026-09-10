import { apiClient } from "@/lib/api/client";
import type { DashboardStats, SalesChartPoint } from "@/types";
export const reportsService = {
  async dashboard() {
    const { data } = await apiClient.get<DashboardStats>("/reports/dashboard");
    return data;
  },
  async salesChart() {
    const { data } = await apiClient.get<SalesChartPoint[]>(
      "/reports/sales-chart",
    );
    return data;
  },
};
