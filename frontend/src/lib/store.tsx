"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { PublicStore } from "./types";

const StoreContext = createContext<PublicStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<PublicStore | null>(null);

  useEffect(() => {
    api<PublicStore>("/settings/public")
      .then(setStore)
      .catch(() => null);
  }, []);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
