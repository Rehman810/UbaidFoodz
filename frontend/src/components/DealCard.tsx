"use client";

import Image from "next/image";
import { ImageIcon, Plus, Sparkles } from "lucide-react";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Deal } from "@/lib/types";

function dealImage(deal: Deal) {
  if (deal.imageUrl) return deal.imageUrl;
  return deal.items[0]?.menuItem.imageUrl || "";
}

export function DealCard({ deal }: { deal: Deal }) {
  const addDeal = useCart((s) => s.addDeal);
  const setDrawer = useCart((s) => s.setDrawer);

  const regular = deal.items.reduce(
    (sum, row) => sum + Number(row.menuItem.price) * row.quantity,
    0
  );
  const price = Number(deal.dealPrice);
  const save = Math.max(0, regular - price);
  const image = dealImage(deal);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-float">
      <div className="relative aspect-[16/10] bg-violet-50">
        {image ? (
          <Image
            src={image}
            alt={deal.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-violet-300">
            <ImageIcon size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          <Sparkles size={12} /> Combo deal
        </div>
        {save > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white">
            Save {pkr(save)}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-display text-xl text-white sm:text-2xl">{deal.title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {deal.description && (
          <p className="text-sm text-stone-500 line-clamp-2">{deal.description}</p>
        )}

        <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Includes</p>
          <ul className="mt-1.5 space-y-1">
            {deal.items.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 text-sm text-stone-700">
                <span className="min-w-0 truncate">
                  {row.quantity}× {row.menuItem.name}
                </span>
                <span className="shrink-0 text-xs text-stone-400">{pkr(Number(row.menuItem.price) * row.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {regular > price && (
              <p className="text-xs text-stone-400 line-through">{pkr(regular)}</p>
            )}
            <p className="text-xl font-bold text-violet-700">{pkr(price)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              addDeal(deal);
              setDrawer(true);
            }}
            className="btn-primary shrink-0 py-2.5 text-sm"
          >
            <Plus size={15} /> Add to bag
          </button>
        </div>
      </div>
    </article>
  );
}
