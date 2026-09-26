"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth";

/** Keeps riders off the customer storefront — admins can preview it from the dashboard. */
export function RoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "RIDER" || user.role === "CHEF") {
      router.replace(homeFor(user.role));
    }
  }, [user, loading, router]);

  return null;
}
