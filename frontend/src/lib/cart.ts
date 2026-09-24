"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Deal, MenuItem } from "./types";

export type CartLine = {
  id: string;
  menuItemId?: string;
  kind?: "item" | "deal";
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  dealId?: string;
  dealItems?: { menuItemId: string; quantity: number }[];
  sizeId?: string;
  addonIds?: string[];
  optionsLabel?: string;
};

export function cartLineKey(menuItemId: string, sizeId?: string, addonIds?: string[]) {
  const addons = [...(addonIds ?? [])].sort().join(",");
  return `${menuItemId}:${sizeId || ""}:${addons}`;
}

type CartState = {
  items: CartLine[];
  add: (item: MenuItem) => void;
  addConfigured: (opts: {
    item: MenuItem;
    price: number;
    sizeId?: string;
    addonIds?: string[];
    optionsLabel?: string;
  }) => void;
  addDeal: (deal: Deal) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  bounce: boolean;
  drawerOpen: boolean;
  setDrawer: (open: boolean) => void;
  ping: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      bounce: false,
      drawerOpen: false,
      setDrawer: (open) => set({ drawerOpen: open }),
      ping: () => {
        set({ bounce: true });
        setTimeout(() => set({ bounce: false }), 420);
      },
      add: (item) => {
        const hasOptions =
          (item.sizes?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0;
        if (hasOptions) return;
        const price = Number(item.effectivePrice ?? item.discountPrice ?? item.price);
        get().addConfigured({ item, price });
      },
      addConfigured: ({ item, price, sizeId, addonIds, optionsLabel }) => {
        const lineId = cartLineKey(item.id, sizeId, addonIds);
        const items = [...get().items];
        const i = items.findIndex((x) => x.id === lineId);
        const label = optionsLabel || item.name;
        if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + 1 };
        else
          items.push({
            id: lineId,
            menuItemId: item.id,
            kind: "item",
            name: label,
            price,
            imageUrl: item.imageUrl,
            quantity: 1,
            sizeId,
            addonIds,
            optionsLabel,
          });
        set({ items, drawerOpen: true });
        get().ping();
      },
      addDeal: (deal) => {
        const id = `deal:${deal.id}`;
        const imageUrl = deal.imageUrl || deal.items[0]?.menuItem.imageUrl || "";
        const items = [...get().items];
        const i = items.findIndex((x) => x.id === id);
        if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + 1 };
        else
          items.push({
            id,
            kind: "deal",
            dealId: deal.id,
            name: deal.title,
            price: Number(deal.dealPrice),
            imageUrl,
            quantity: 1,
            dealItems: deal.items.map((row) => ({
              menuItemId: row.menuItemId,
              quantity: row.quantity,
            })),
          });
        set({ items, drawerOpen: true });
        get().ping();
      },
      setQty: (id, qty) => {
        if (qty <= 0) set({ items: get().items.filter((x) => x.id !== id) });
        else
          set({
            items: get().items.map((x) => (x.id === id ? { ...x, quantity: qty } : x)),
          });
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: "uff_cart", partialize: (s) => ({ items: s.items }) }
  )
);

export function cartCount(items: CartLine[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartTotal(items: CartLine[]) {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
