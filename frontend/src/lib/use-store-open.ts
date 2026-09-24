"use client";

import { useEffect, useState } from "react";
import { isStoreOpen, storeStatusLabel } from "./store-hours";
import { useStore } from "./store";

/** Live open/closed state from store hours (Karachi time), refreshed every minute. */
export function useStoreOpen() {
  const store = useStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!store) {
    return {
      loading: true,
      isOpen: true,
      closedMessage: "",
      hoursLabel: "",
      statusLabel: "",
    };
  }

  const open = isStoreOpen(store.settings, now);

  return {
    loading: false,
    isOpen: open,
    closedMessage: store.closedMessage,
    hoursLabel: store.hoursLabel,
    statusLabel: storeStatusLabel(store.settings, now),
  };
}
