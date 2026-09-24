"use client";

import Image from "next/image";
import { ImageIcon, Plus, Sparkles } from "lucide-react";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useDealModal } from "@/lib/deal-modal";
import { useStoreOpen } from "@/lib/use-store-open";
import { Deal } from "@/lib/types";

function dealImage(deal: Deal) {
  if (deal.imageUrl) return deal.imageUrl;
  return deal.items[0]?.menuItem.imageUrl || "";
}

export function DealCard({ deal }: { deal: Deal }) {
  const addDeal = useCart((s) => s.addDeal);
  const openModal = useDealModal((s) => s.open);
  const { isOpen: storeOpen } = useStoreOpen();

  const regular = deal.items.reduce(
    (sum, row) => sum + Number(row.menuItem.price) * row.quantity,
    0
  );
  const price = Number(deal.dealPrice);
  const save = Math.max(0, regular - price);
  const savePct = regular > 0 ? Math.round((save / regular) * 100) : 0;
  const image = dealImage(deal);
  const includes = deal.items.map((r) => `${r.quantity}× ${r.menuItem.name}`).join(" · ");

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!storeOpen) return;
    addDeal(deal, { openDrawer: false });
  }

  function openDeal() {
    openModal(deal);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDeal}
      onKeyDown={(e) => e.key === "Enter" && openDeal()}
      className="group flex cursor-pointer gap-4 rounded-3xl border border-orange-100/80 bg-gradient-to-br from-white to-[#fffaf5] p-4 shadow-[0_8px_30px_rgba(28,25,23,0.07)] transition hover:-translate-y-0.5 hover:shadow-card sm:gap-5 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">
            <Sparkles size={11} /> Combo deal
          </span>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
            {deal.title}
          </h3>
          {deal.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600">{deal.description}</p>
          ) : (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">{includes}</p>
          )}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            {regular > price && (
              <span className="text-sm text-stone-400 line-through">{pkr(regular)}</span>
            )}
            <span className="text-2xl font-bold text-brand-700 sm:text-3xl">{pkr(price)}</span>
            {save > 0 && (
              <span className="text-xs font-semibold text-emerald-700">Save {pkr(save)}</span>
            )}
          </div>
          <span className="text-xs font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
            Tap to view →
          </span>
        </div>
      </div>

      <div className="relative h-[8.5rem] w-[8.5rem] shrink-0 sm:h-[9.5rem] sm:w-[9.5rem]">
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-orange-100">
          {image ? (
            <Image
              src={image}
              alt={deal.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width:640px) 136px, 152px"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-brand-300">
              <ImageIcon size={28} />
            </div>
          )}
          {savePct > 0 && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-stone-900 shadow-sm">
              {savePct}% OFF
            </span>
          )}
        </div>
        {storeOpen && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute -bottom-1.5 -right-1.5 z-10 grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white shadow-lg ring-2 ring-white transition hover:bg-brand-500 sm:h-11 sm:w-11"
            aria-label={`Add ${deal.title}`}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </article>
  );
}
