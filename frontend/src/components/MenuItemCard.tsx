"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, UtensilsCrossed } from "lucide-react";
import { MenuItem } from "@/lib/types";
import { pkr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useItemModal } from "@/lib/item-modal";
import { useStoreOpen } from "@/lib/use-store-open";
import {
  buildQuickAddConfig,
  menuItemDiscountPercent,
  menuItemPrice,
  menuItemStrikePrice,
} from "@/lib/menu-price";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const open = useItemModal((s) => s.open);
  const addConfigured = useCart((s) => s.addConfigured);
  const { isOpen: storeOpen } = useStoreOpen();
  const [imgError, setImgError] = useState(false);
  const canOrder = item.isAvailable && storeOpen;

  const price = menuItemPrice(item);
  const strike = menuItemStrikePrice(item);
  const discountPct = menuItemDiscountPercent(item);
  const hasOptions = (item.optionGroups?.length ?? 0) > 0;

  function openModal() {
    if (item.isAvailable) open(item);
  }

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canOrder) return;
    const config = buildQuickAddConfig(item);
    addConfigured({
      item,
      price: config.price,
      optionIds: config.optionIds,
      optionsLabel: config.optionsLabel,
      openDrawer: false,
    });
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openModal}
      onKeyDown={(e) => e.key === "Enter" && openModal()}
      className={`group flex cursor-pointer gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_8px_rgba(28,25,23,0.07)] ring-1 ring-stone-200/60 transition hover:shadow-[0_4px_16px_rgba(234,88,12,0.1)] hover:ring-brand-200/70 sm:gap-4 sm:p-4 ${
        !item.isAvailable ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-stone-900 sm:text-base">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500 sm:text-[13px]">
            {item.description}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {strike != null && (
            <span className="text-xs text-stone-400 line-through">{pkr(strike)}</span>
          )}
          <span className="text-lg font-bold text-brand-700 sm:text-xl">{pkr(price)}</span>
          {hasOptions && (
            <span className="text-[10px] font-medium text-stone-400">· from</span>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative h-[7.25rem] w-[7.25rem] shrink-0 sm:h-28 sm:w-28">
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-stone-100">
          {!imgError && item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 116px, 112px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-stone-300">
              <UtensilsCrossed size={24} />
            </div>
          )}

          {!item.isAvailable && (
            <div className="absolute inset-0 grid place-items-center bg-stone-900/50 text-[10px] font-bold text-white">
              Sold out
            </div>
          )}

          {discountPct != null && discountPct > 0 && (
            <span className="absolute left-1 top-1 rounded bg-amber-400 px-1 py-0.5 text-[8px] font-black leading-none text-stone-900 sm:text-[9px]">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {item.isAvailable && storeOpen && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute -bottom-1 -right-1 z-10 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white transition hover:bg-brand-500 active:scale-95 sm:h-9 sm:w-9"
            aria-label={`Quick add ${item.name}`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </article>
  );
}
