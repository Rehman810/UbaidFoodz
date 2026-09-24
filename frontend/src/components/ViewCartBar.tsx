"use client";

import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { cartCount, cartTotal, useCart } from "@/lib/cart";
import { useFulfillment } from "@/lib/fulfillment";
import { pkr } from "@/lib/format";
import { useStoreOpen } from "@/lib/use-store-open";

export function ViewCartBar() {
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const subtotal = cartTotal(items);
  const { mode, deliveryCharge } = useFulfillment();
  const { isOpen: storeOpen, statusLabel } = useStoreOpen();
  const deliveryFee = mode === "DELIVERY" ? deliveryCharge : 0;
  const total = subtotal + deliveryFee;

  if (count === 0) return null;

  if (!storeOpen) {
    return (
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg sm:bottom-6">
        <div
          className="pointer-events-auto flex items-center justify-center gap-2 rounded-full bg-stone-800 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg"
          role="status"
        >
          We&apos;re closed · {statusLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg sm:bottom-6">
      <Link
        href="/checkout"
        className="pointer-events-auto flex items-center gap-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-white shadow-[0_12px_32px_rgba(234,88,12,0.42)] ring-1 ring-white/25 transition hover:from-brand-500 hover:to-brand-400 active:scale-[0.99]"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
          <ShoppingBag size={16} />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-700">
            {count}
          </span>
        </span>
        <span className="flex-1 text-sm font-bold tracking-wide">View cart</span>
        <span className="text-sm font-bold">{pkr(total)}</span>
        <ChevronRight size={18} className="opacity-90" />
      </Link>
    </div>
  );
}
