"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/lib/api/client";
import type { LoginPayload, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isHydrating: boolean;
  login: (payload: LoginPayload, remember: boolean) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      return null;
    }
    try {
      const activeUser = await authService.me();
      setUser(activeUser);
      return activeUser;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshUser().finally(() => setIsHydrating(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      router.replace("/login");
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession, router]);

  const login = useCallback(
    async (payload: LoginPayload, remember: boolean) => {
      const response = await authService.login(payload);
      storeToken(response.token, remember);
      try {
        const verifiedUser = await authService.me();
        setUser(verifiedUser);
        return verifiedUser;
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [clearSession],
  );

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) await authService.logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, router]);

  const value = useMemo(
    () => ({ user, isHydrating, login, logout, refreshUser }),
    [user, isHydrating, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
