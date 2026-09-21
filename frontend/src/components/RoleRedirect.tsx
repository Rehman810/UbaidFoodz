"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";

/** Keeps staff off the customer storefront — sends them to their app home. */
export function RoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "ADMIN" || user.role === "RIDER") {
      router.replace(homeFor(user.role));
    }
  }, [user, loading, router]);

  return null;
}
