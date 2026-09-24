"use client";

import { create } from "zustand";
import { Deal } from "./types";

type DealModalState = {
  deal: Deal | null;
  open: (deal: Deal) => void;
  close: () => void;
};

export const useDealModal = create<DealModalState>((set) => ({
  deal: null,
  open: (deal) => set({ deal }),
  close: () => set({ deal: null }),
}));
