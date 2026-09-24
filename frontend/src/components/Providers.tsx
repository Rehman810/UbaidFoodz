"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { CartDrawer } from "./CartDrawer";
import { FulfillmentModal } from "./FulfillmentModal";
import { ItemDeepLink } from "./ItemDeepLink";
import { ItemDetailModal } from "./ItemDetailModal";
import { KeepAlive } from "./KeepAlive";
import { ViewCartBar } from "./ViewCartBar";

function isCustomerSurface(pathname: string) {
  if (pathname === "/login") return false;
  if (pathname.startsWith("/admin") || pathname.startsWith("/rider")) return false;
  return true;
}

function CustomerOverlays() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!isCustomerSurface(pathname)) return null;
  if (user && user.role !== "CUSTOMER") return null;
  return (
    <>
      <FulfillmentModal />
      <ItemDeepLink />
      <ItemDetailModal />
      <ViewCartBar />
      <CartDrawer />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <KeepAlive />
        {children}
        <CustomerOverlays />
      </StoreProvider>
    </AuthProvider>
  );
}
