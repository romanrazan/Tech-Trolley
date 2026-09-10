import { apiClient } from "@/lib/api/client";
import type { InventorySummary, InventoryUnit } from "@/types";
export const inventoryService = {
  async stock() {
    const { data } = await apiClient.get<InventorySummary>("/inventory/stock");
    return data;
  },
  async imei(value: string) {
    const { data } = await apiClient.get<InventoryUnit>(
      `/inventory/imeis/${encodeURIComponent(value)}`,
    );
    return data;
  },
};
