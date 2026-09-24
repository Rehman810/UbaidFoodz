"use client";

import { create } from "zustand";
import { MenuItem } from "./types";

type ItemModalState = {
  item: MenuItem | null;
  open: (item: MenuItem) => void;
  close: () => void;
};

export const useItemModal = create<ItemModalState>((set) => ({
  item: null,
  open: (item) => set({ item }),
  close: () => set({ item: null }),
}));
