"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FulfillmentType } from "./types";

type FulfillmentState = {
  hasChosen: boolean;
  mode: FulfillmentType;
  areaId: string | null;
  areaName: string | null;
  deliveryCharge: number;
  branchId: string | null;
  branchName: string | null;
  branchAddress: string | null;
  setDelivery: (
    areaId: string,
    areaName: string,
    deliveryCharge: number,
    branch: { id: string; name: string; address: string }
  ) => void;
  setPickup: (branch: { id: string; name: string; address: string }) => void;
  clearArea: () => void;
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
};

export const useFulfillment = create<FulfillmentState>()(
  persist(
    (set) => ({
      hasChosen: false,
      mode: "DELIVERY",
      areaId: null,
      areaName: null,
      deliveryCharge: 0,
      branchId: null,
      branchName: null,
      branchAddress: null,
      openModal: false,
      setOpenModal: (open) => set({ openModal: open }),
      setDelivery: (areaId, areaName, deliveryCharge, branch) =>
        set({
          hasChosen: true,
          mode: "DELIVERY",
          areaId,
          areaName,
          deliveryCharge,
          branchId: branch.id,
          branchName: branch.name,
          branchAddress: branch.address,
          openModal: false,
        }),
      setPickup: (branch) =>
        set({
          hasChosen: true,
          mode: "PICKUP",
          areaId: null,
          areaName: null,
          deliveryCharge: 0,
          branchId: branch.id,
          branchName: branch.name,
          branchAddress: branch.address,
          openModal: false,
        }),
      clearArea: () =>
        set({
          areaId: null,
          areaName: null,
          deliveryCharge: 0,
        }),
    }),
    { name: "uff_fulfillment" }
  )
);
