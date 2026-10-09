"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";

/** Staff land on their workspace; admins may browse the storefront. */
export function RoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "RIDER" || user.role === "CHEF" || user.role === "CASHIER" || user.role === "WAITER") {
      router.replace(homeFor(user.role));
    }
  }, [user, loading, router]);

  return null;
}
