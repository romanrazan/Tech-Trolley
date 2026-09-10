import { apiClient } from "@/lib/api/client";
import type { Shop } from "@/types";
export const shopService = {
  async get() {
    const { data } = await apiClient.get<Shop>("/shop");
    return data;
  },
  async update(payload: Omit<Shop, "id">) {
    const { data } = await apiClient.put<Shop>("/shop", payload);
    return data;
  },
};
