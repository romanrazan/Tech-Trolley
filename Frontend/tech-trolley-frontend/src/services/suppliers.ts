import { apiClient } from "@/lib/api/client";
import type {
  DueSummary,
  Supplier,
  SupplierDetails,
  SupplierInput,
} from "@/types";
export const suppliersService = {
  async list() {
    const { data } = await apiClient.get<Supplier[]>("/suppliers");
    return data;
  },
  async get(id: string) {
    const { data } = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return data;
  },
  async update(id: string, payload: SupplierInput) {
    const { data } = await apiClient.put<Supplier>(`/suppliers/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await apiClient.delete(`/suppliers/${id}`);
  },
  async dues(id: string) {
    const { data } = await apiClient.get<DueSummary>(`/suppliers/${id}/dues`);
    return data;
  },
  async details(id: string) {
    const { data } = await apiClient.get<SupplierDetails>(
      `/suppliers/${id}/details`,
    );
    return data;
  },
};
