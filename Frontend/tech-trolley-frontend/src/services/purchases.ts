import { apiClient } from "@/lib/api/client";
import type {
  Payment,
  PaymentInput,
  Purchase,
  PurchaseDetail,
  PurchaseInput,
} from "@/types";
export const purchasesService = {
  async list() {
    const { data } = await apiClient.get<Purchase[]>("/purchases");
    return data;
  },
  async get(id: string) {
    const { data } = await apiClient.get<PurchaseDetail>(`/purchases/${id}`);
    return data;
  },
  async create(payload: PurchaseInput) {
    const { data } = await apiClient.post<Purchase>("/purchases", payload);
    return data;
  },
  async addPayment(id: string, payload: PaymentInput) {
    const { data } = await apiClient.post<Payment>(
      `/purchases/${id}/payments`,
      payload,
    );
    return data;
  },
};
