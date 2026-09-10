import { apiClient } from "@/lib/api/client";
import type { LoginPayload, LoginResponse, User } from "@/types";

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },
  async me() {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
  async logout() {
    const { data } = await apiClient.post<{ message: string }>("/auth/logout");
    return data;
  },
};
