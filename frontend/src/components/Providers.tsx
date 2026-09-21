"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { CartDrawer } from "./CartDrawer";

function CartForCustomers() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role !== "CUSTOMER") return null;
  return <CartDrawer />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CartForCustomers />
    </AuthProvider>
  );
}
