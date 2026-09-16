"use client";

import { AuthProvider } from "@/lib/auth";
import { CartDrawer } from "./CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CartDrawer />
    </AuthProvider>
  );
}
