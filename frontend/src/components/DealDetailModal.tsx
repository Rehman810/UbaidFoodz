"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Sparkles, Tag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useDealModal } from "@/lib/deal-modal";
import { useStoreOpen } from "@/lib/use-store-open";
import { pkr } from "@/lib/format";
import { Deal } from "@/lib/types";

function dealImage(deal: Deal) {
  if (deal.imageUrl) return deal.imageUrl;
  return deal.items[0]?.menuItem.imageUrl || "";
}

export function DealDetailModal() {
  const deal = useDealModal((s) => s.deal);
  const close = useDealModal((s) => s.close);
  const addDeal = useCart((s) => s.addDeal);
  const { isOpen: storeOpen } = useStoreOpen();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!deal) return;
    setQty(1);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [deal?.id]);

  if (!deal) return null;

  const regular = deal.items.reduce(
    (sum, row) => sum + Number(row.menuItem.price) * row.quantity,
    0
  );
  const price = Number(deal.dealPrice);
  const save = Math.max(0, regular - price);
  const savePct = regular > 0 ? Math.round((save / regular) * 100) : 0;
  const image = dealImage(deal);

  function addToCart() {
    if (!storeOpen) return;
    for (let i = 0; i < qty; i++) addDeal(deal, { openDrawer: false });
    close();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={close} />
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl md:flex-row">
        <div className="relative h-56 w-full shrink-0 md:h-auto md:min-h-[28rem] md:w-[42%]">
          {image ? (
            <Image src={image} alt={deal.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-orange-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-stone-950/15" />
          {savePct > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-900 shadow">
              Save {savePct}%
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
            <p className="font-display text-2xl text-white">{deal.title}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                <Sparkles size={11} /> Combo deal
              </span>
              <h2 className="mt-2 hidden font-display text-2xl text-stone-900 md:block">{deal.title}</h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                {regular > price && (
                  <span className="text-sm text-stone-400 line-through">{pkr(regular)}</span>
                )}
                <span className="text-2xl font-bold text-brand-700">{pkr(price)}</span>
                {save > 0 && (
                  <span className="text-xs font-semibold text-emerald-700">You save {pkr(save)}</span>
                )}
              </div>
              {deal.description && (
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{deal.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-800">
              <Tag size={15} className="text-brand-600" />
              What&apos;s included
            </p>
            <ul className="space-y-2">
              {deal.items.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-xl border border-orange-100 bg-[#fffaf5] px-3 py-2.5"
                >
                  {row.menuItem.imageUrl ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                      <Image src={row.menuItem.imageUrl} alt="" fill className="object-cover" sizes="44px" />
                    </div>
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-brand-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900">{row.menuItem.name}</p>
                    <p className="text-xs text-stone-500">{row.menuItem.category}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-orange-100">
                    ×{row.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 border-t border-stone-100 bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
              >
                {qty <= 1 ? <Trash2 size={16} /> : <Minus size={16} />}
              </button>
              <span className="w-6 text-center text-lg font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              disabled={!storeOpen}
              onClick={addToCart}
              className="btn-primary h-12 flex-1 text-base font-bold"
            >
              {!storeOpen ? "Closed for orders" : `${pkr(price * qty)} | Add to Cart →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
