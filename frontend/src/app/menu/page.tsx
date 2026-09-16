"use client";

import { useEffect, useMemo, useState } from "react";
import { StoreShell } from "@/components/StoreShell";
import { MenuCard } from "@/components/MenuCard";
import { api } from "@/lib/api";
import { CATEGORIES, MenuItem } from "@/lib/types";

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [cat, setCat] = useState<string>("All");
  const [error, setError] = useState("");

  useEffect(() => {
    api<MenuItem[]>("/menu")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (cat === "All") return items;
    return items.filter((i) => i.category === cat);
  }, [items, cat]);

  return (
    <StoreShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Full menu</p>
        <h1 className="font-display mt-1 text-4xl">What are you craving?</h1>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                cat === c ? "bg-brand-600 text-white" : "bg-white text-stone-600 shadow-card"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
        {!items && !error && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-80" />
            ))}
          </div>
        )}
        {items && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
