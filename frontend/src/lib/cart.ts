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
  optionIds?: string[];
  addonIds?: string[];
  optionsLabel?: string;
  instructions?: string;
};

export function cartLineKey(
  menuItemId: string,
  optionIds?: string[],
  addonIds?: string[],
  instructions?: string
) {
  const opts = [...(optionIds ?? [])].sort().join(",");
  const addons = [...(addonIds ?? [])].sort().join(",");
  const note = (instructions ?? "").trim();
  return `${menuItemId}:${opts}:${addons}:${note}`;
}

type CartState = {
  items: CartLine[];
  addConfigured: (opts: {
    item: MenuItem;
    price: number;
    quantity?: number;
    optionIds?: string[];
    addonIds?: string[];
    optionsLabel?: string;
    instructions?: string;
    openDrawer?: boolean;
  }) => void;
  addDeal: (deal: Deal, opts?: { openDrawer?: boolean }) => void;
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
      addConfigured: ({
        item,
        price,
        quantity = 1,
        optionIds,
        addonIds,
        optionsLabel,
        instructions,
        openDrawer = false,
      }) => {
        const note = (instructions ?? "").trim();
        const lineId = cartLineKey(item.id, optionIds, addonIds, note);
        const items = [...get().items];
        const i = items.findIndex((x) => x.id === lineId);
        const label = optionsLabel || item.name;
        if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + quantity };
        else
          items.push({
            id: lineId,
            menuItemId: item.id,
            kind: "item",
            name: label,
            price,
            imageUrl: item.imageUrl,
            quantity,
            optionIds,
            addonIds,
            optionsLabel,
            instructions: note,
          });
        set({ items, ...(openDrawer ? { drawerOpen: true } : {}) });
        get().ping();
      },
      addDeal: (deal, opts) => {
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
        set({ items, ...(opts?.openDrawer ? { drawerOpen: true } : {}) });
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve menu item id from a cart line (handles legacy persisted carts). */
export function resolveMenuItemId(line: CartLine): string | null {
  if (line.kind === "deal") return null;
  if (line.menuItemId && UUID_RE.test(line.menuItemId)) return line.menuItemId;
  const head = line.id.split(":")[0];
  if (UUID_RE.test(head)) return head;
  return null;
}

export function cartItemLines(items: CartLine[]) {
  return items.filter((i) => !i.kind || i.kind === "item");
}

export function cartDealLines(items: CartLine[]) {
  return items.filter((i) => i.kind === "deal" && i.dealId);
}
