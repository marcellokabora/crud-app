"use client";

import { createContext, use, useEffect, useState } from "react";
import { api, ApiError, Administrator } from "@/lib/api/client";

interface AuthContextValue {
  administrator: Administrator | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setAdministrator)
      .catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 401 || error.code === "api_unavailable")) return;
        console.warn("Unable to verify the administrator session.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthenticated = () => setAdministrator(null);
    window.addEventListener("ledger:unauthenticated", handleUnauthenticated);
    return () => window.removeEventListener("ledger:unauthenticated", handleUnauthenticated);
  }, []);

  const login = async (email: string, password: string) => {
    setAdministrator(await api.login(email, password));
  };

  const logout = async () => {
    await api.logout();
    setAdministrator(null);
  };

  return (
    <AuthContext value={{ administrator, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}