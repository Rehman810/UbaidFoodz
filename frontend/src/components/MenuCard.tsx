"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { itemNeedsOptions, menuItemHasDiscount, menuItemPrice } from "@/lib/menu-price";
import { ItemOptionsModal } from "./ItemOptionsModal";

export function MenuCard({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);
  const discounted = menuItemHasDiscount(item);
  const price = menuItemPrice(item);

  function onAdd() {
    if (itemNeedsOptions(item)) setOptionsItem(item);
    else add(item);
  }

  return (
    <>
      <article className="group card overflow-hidden transition hover:-translate-y-1">
        <div className="relative h-44 overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          {!item.isAvailable && (
            <div className="absolute inset-0 grid place-items-center bg-stone-900/50 text-sm font-semibold text-white">
              Sold out
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-800">
            {item.category}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl leading-tight">{item.name}</h3>
            <div className="shrink-0 text-right">
              {discounted && (
                <p className="text-xs text-stone-400 line-through">{pkr(item.price)}</p>
              )}
              <p className="font-semibold text-brand-700">{pkr(price)}</p>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-stone-500">{item.description}</p>
          <button
            disabled={!item.isAvailable}
            onClick={onAdd}
            className="btn-primary mt-4 w-full"
          >
            <Plus size={16} /> Add to cart
          </button>
        </div>
      </article>
      <ItemOptionsModal item={optionsItem} onClose={() => setOptionsItem(null)} />
    </>
  );
}
