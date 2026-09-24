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

  const regular = deal.items.reduce(
    (sum, row) => sum + Number(row.menuItem.price) * row.quantity,
    0
  );
  const price = Number(deal.dealPrice);
  const save = Math.max(0, regular - price);
  const savePct = regular > 0 ? Math.round((save / regular) * 100) : 0;
  const image = dealImage(deal);
  const includes = deal.items.map((r) => `${r.quantity}× ${r.menuItem.name}`).join(", ");

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addDeal(deal, { openDrawer: false });
  }

  return (
    <article
      className="group flex cursor-pointer gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(28,25,23,0.07)] ring-1 ring-violet-100 transition hover:shadow-md sm:gap-4 sm:p-4"
      onClick={() => addDeal(deal, { openDrawer: false })}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-600">
            <Sparkles size={10} /> Combo deal
          </span>
          <h3 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-stone-900 sm:text-base">
            {deal.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {includes}
          </p>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          {regular > price && (
            <span className="text-xs text-stone-400 line-through">{pkr(regular)}</span>
          )}
          <span className="text-lg font-bold text-violet-700 sm:text-xl">{pkr(price)}</span>
        </div>
      </div>

      <div className="relative h-[7.25rem] w-[7.25rem] shrink-0 sm:h-28 sm:w-28">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-violet-50">
          {image ? (
            <Image src={image} alt={deal.title} fill className="object-cover" sizes="(max-width:640px) 116px, 112px" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-violet-300">
              <ImageIcon size={24} />
            </div>
          )}
          {savePct > 0 && (
            <span className="absolute left-1 top-1 rounded bg-amber-400 px-1 py-0.5 text-[8px] font-black text-stone-900">
              {savePct}% OFF
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={quickAdd}
          className="absolute -bottom-1 -right-1 z-10 grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white shadow-md ring-2 ring-white sm:h-9 sm:w-9"
          aria-label={`Add ${deal.title}`}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}
