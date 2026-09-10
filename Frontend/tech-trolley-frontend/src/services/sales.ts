import { apiClient } from "@/lib/api/client";
import type {
  Payment,
  PaymentInput,
  Sale,
  SaleDetail,
  SaleInput,
} from "@/types";
export const salesService = {
  async list() {
    const { data } = await apiClient.get<Sale[]>("/sales");
    return data;
  },
  async get(id: string) {
    const { data } = await apiClient.get<SaleDetail>(`/sales/${id}`);
    return data;
  },
  async create(payload: SaleInput) {
    const { data } = await apiClient.post<Sale>("/sales", payload);
    return data;
  },
  async addPayment(id: string, payload: PaymentInput) {
    const { data } = await apiClient.post<Payment>(
      `/sales/${id}/payments`,
      payload,
    );
    return data;
  },
};
