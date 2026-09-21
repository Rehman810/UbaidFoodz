"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { Role, User } from "./types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

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
        const res = await api<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("uff_token", res.token);
        setUser(res.user);
        return res.user;
      },
      register: async (data) => {
        const res = await api<{ token: string; user: User }>("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        localStorage.setItem("uff_token", res.token);
        setUser(res.user);
        return res.user;
      },
      logout: () => {
        localStorage.removeItem("uff_token");
        setUser(null);
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
  if (role === "RIDER") return "/rider";
  return "/menu";
}

/** Send users to a `next` URL only when their role is allowed there. */
export function resolveLoginRedirect(role: Role, next: string | null) {
  const home = homeFor(role);
  if (!next) return home;
  if (role === "ADMIN" && next.startsWith("/admin")) return next;
  if (role === "RIDER" && next.startsWith("/rider")) return next;
  if (role === "CUSTOMER" && !next.startsWith("/admin") && !next.startsWith("/rider")) return next;
  return home;
}
