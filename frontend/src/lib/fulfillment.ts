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
  setDelivery: (areaId: string, areaName: string, deliveryCharge: number) => void;
  setPickup: () => void;
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
      openModal: false,
      setOpenModal: (open) => set({ openModal: open }),
      setDelivery: (areaId, areaName, deliveryCharge) =>
        set({
          hasChosen: true,
          mode: "DELIVERY",
          areaId,
          areaName,
          deliveryCharge,
          openModal: false,
        }),
      setPickup: () =>
        set({
          hasChosen: true,
          mode: "PICKUP",
          areaId: null,
          areaName: null,
          deliveryCharge: 0,
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

export const PICKUP_LOCATION = "Ubaid Fast Foodz — Boat Basin, Clifton Block 5, Karachi";
