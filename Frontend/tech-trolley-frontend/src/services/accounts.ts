import { createCrudService } from "./crud";
import { apiClient } from "@/lib/api/client";
import type {
  Account,
  AccountInput,
  AccountUpdateInput,
  PaymentAccountOption,
} from "@/types";

export const accountsService = {
  ...createCrudService<Account, AccountInput, AccountUpdateInput>("/accounts"),
  async paymentOptions() {
    const { data } = await apiClient.get<PaymentAccountOption[]>(
      "/accounts/payment-options",
    );
    return data;
  },
};
