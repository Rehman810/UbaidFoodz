"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { setDisplayCurrency } from "./format";
import { PublicStore } from "./types";

const StoreContext = createContext<PublicStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<PublicStore | null>(null);

  useEffect(() => {
    api<PublicStore>("/settings/public")
      .then((data) => {
        setStore(data);
        setDisplayCurrency(data.settings);
        const name = data.settings.storeName?.trim();
        const tag = data.settings.storeTagline?.trim();
        if (name) document.title = tag ? `${name} — ${tag}` : name;
        const root = document.documentElement;
        if (data.settings.primaryColor) root.style.setProperty("--brand-600", data.settings.primaryColor);
        if (data.settings.accentColor) root.style.setProperty("--brand-700", data.settings.accentColor);
        const icon = data.settings.faviconUrl?.trim();
        if (icon) {
          let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = icon;
        }
      })
      .catch(() => null);
  }, []);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
