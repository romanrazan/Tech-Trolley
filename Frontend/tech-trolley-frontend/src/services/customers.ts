import { apiClient } from "@/lib/api/client";
import { createCrudService } from "./crud";
import type {
  ContactInput,
  Customer,
  CustomerDetails,
  DueSummary,
} from "@/types";
export const customersService = {
  ...createCrudService<Customer, ContactInput>("/customers"),
  async dues(id: string) {
    const { data } = await apiClient.get<DueSummary>(`/customers/${id}/dues`);
    return data;
  },
  async details(id: string) {
    const { data } = await apiClient.get<CustomerDetails>(
      `/customers/${id}/details`,
    );
    return data;
  },
};
