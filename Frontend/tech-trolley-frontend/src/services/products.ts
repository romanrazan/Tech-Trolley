import { apiClient } from "@/lib/api/client";
import { createCrudService } from "./crud";
import type { Product, ProductInput, ProductUpdateInput } from "@/types";
export const productsService = {
  ...createCrudService<Product, ProductInput, ProductUpdateInput>("/products"),
  async setStatus(id: string, isActive: boolean) {
    const { data } = await apiClient.patch<Product>(`/products/${id}/status`, {
      isActive,
    });
    return data;
  },
};
