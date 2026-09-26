"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { Role, User } from "./types";
import { reconnectLiveSocket } from "@/hooks/useLiveOrders";

type LoginResult =
  | { user: User; requiresTwoFactor?: false }
  | { requiresTwoFactor: true; challengeToken: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (challengeToken: string, code: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function persistSession(token: string, user: User, setUser: (u: User) => void) {
  localStorage.setItem("uff_token", token);
  setUser(user);
  reconnectLiveSocket();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("uff_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("uff_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const res = await api<{ token?: string; user?: User; requiresTwoFactor?: boolean; challengeToken?: string }>(
          "/auth/login",
          { method: "POST", body: JSON.stringify({ email, password }) }
        );
        if (res.requiresTwoFactor && res.challengeToken) {
          return { requiresTwoFactor: true, challengeToken: res.challengeToken };
        }
        if (!res.token || !res.user) throw new Error("Login failed");
        persistSession(res.token, res.user, setUser);
        return { user: res.user };
      },
      verifyTwoFactor: async (challengeToken, code) => {
        const res = await api<{ token: string; user: User }>("/auth/login/2fa", {
          method: "POST",
          body: JSON.stringify({ challengeToken, code }),
        });
        persistSession(res.token, res.user, setUser);
        return res.user;
      },
      register: async (data) => {
        const res = await api<{ token: string; user: User }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        persistSession(res.token, res.user, setUser);
        return res.user;
      },
      logout: () => {
        localStorage.removeItem("uff_token");
        setUser(null);
        reconnectLiveSocket();
      },
    }),
    [user, loading]
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function homeFor(role?: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "CHEF") return "/admin/kitchen";
  if (role === "RIDER") return "/rider";
  return "/menu";
}

export function resolveLoginRedirect(role: Role, next: string | null) {
  const home = homeFor(role);
  if (!next) return home;
  if (role === "ADMIN" && next.startsWith("/admin")) return next;
  if (role === "CHEF" && next.startsWith("/admin/kitchen")) return next;
  if (role === "RIDER" && next.startsWith("/rider")) return next;
  if (role === "CUSTOMER" && !next.startsWith("/admin") && !next.startsWith("/rider")) return next;
  return home;
}
