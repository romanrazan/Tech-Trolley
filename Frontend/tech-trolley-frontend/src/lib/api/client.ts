import axios, { AxiosError } from "axios";
import type { ApiErrorPayload } from "@/types";

export const TOKEN_KEY = "tech_trolley_token";
export const AUTH_UNAUTHORIZED_EVENT = "tech-trolley:unauthorized";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

export function storeToken(token: string, remember: boolean) {
  if (typeof window === "undefined") return;
  clearStoredToken();
  (remember ? window.localStorage : window.sessionStorage).setItem(
    TOKEN_KEY,
    token,
  );
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredToken();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(" · ");
    if (message) return message;
    if (error.code === "ECONNABORTED")
      return "The request timed out. Try again.";
    if (!error.response)
      return "Cannot reach the Tech Trolley server. Check that the backend is running.";
    return (
      error.response.data?.error ?? `Request failed (${error.response.status}).`
    );
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
