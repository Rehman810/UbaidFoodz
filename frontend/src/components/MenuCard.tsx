"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";

export function MenuCard({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  return (
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
          <p className="shrink-0 font-semibold text-brand-700">{pkr(item.price)}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-stone-500">{item.description}</p>
        <button
          disabled={!item.isAvailable}
          onClick={() => add(item)}
          className="btn-primary mt-4 w-full"
        >
          <Plus size={16} /> Add to cart
        </button>
      </div>
    </article>
  );
}
