"use client";

import { AuthProvider, useAuth } from "@/lib/auth";
import { CartDrawer } from "./CartDrawer";
import { FulfillmentModal } from "./FulfillmentModal";

function CustomerOverlays() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.role !== "CUSTOMER") return null;
  return (
    <>
      <FulfillmentModal />
      <CartDrawer />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CustomerOverlays />
    </AuthProvider>
  );
}
