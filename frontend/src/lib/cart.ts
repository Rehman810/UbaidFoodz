"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem } from "./types";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  add: (item: MenuItem) => void;
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
        const items = [...get().items];
        const i = items.findIndex((x) => x.id === item.id);
        if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + 1 };
        else
          items.push({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            imageUrl: item.imageUrl,
            quantity: 1,
          });
        set({ items });
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
