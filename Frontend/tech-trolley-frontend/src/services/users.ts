import { apiClient } from "@/lib/api/client";
import { createCrudService } from "./crud";
import type { User, UserInput, UserUpdateInput } from "@/types";

export const usersService = {
  ...createCrudService<User, UserInput, UserUpdateInput>("/users"),
  async register(payload: UserInput) {
    const { data } = await apiClient.post<User>("/auth/register", payload);
    return data;
  },
  async setStatus(id: string, isActive: boolean) {
    const { data } = await apiClient.patch<User>(`/users/${id}/status`, {
      isActive,
    });
    return data;
  },
};
