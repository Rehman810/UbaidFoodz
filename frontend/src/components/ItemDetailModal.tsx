"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Share2, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useItemModal } from "@/lib/item-modal";
import { useStoreOpen } from "@/lib/use-store-open";
import { pkr } from "@/lib/format";
import { menuItemHasDiscount, menuItemPrice, optionPrice } from "@/lib/menu-price";
import { MenuItemOptionGroup } from "@/lib/types";

export function ItemDetailModal() {
  const item = useItemModal((s) => s.item);
  const close = useItemModal((s) => s.close);
  const addConfigured = useCart((s) => s.addConfigured);
  const { isOpen: storeOpen } = useStoreOpen();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [qty, setQty] = useState(1);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  const groups = item?.optionGroups ?? [];
  const addons = item?.addons ?? [];

  useEffect(() => {
    if (!item) return;
    const init: Record<string, string> = {};
    for (const g of groups) {
      if (g.options[0]) init[g.id] = g.options[0].id;
    }
    setSelected(init);
    setAddonIds([]);
    setInstructions("");
    setQty(1);
    setShareStatus("idle");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [item?.id]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let price = 0;
    const picked = Object.values(selected);
    if (picked.length) {
      for (const g of groups) {
        const opt = g.options.find((o) => o.id === selected[g.id]);
        if (opt) price += optionPrice(opt);
      }
    } else {
      price = menuItemPrice(item);
    }
    for (const id of addonIds) {
      const addon = addons.find((a) => a.id === id);
      if (addon) price += Number(addon.price);
    }
    return price;
  }, [item, groups, selected, addonIds, addons]);

  if (!item) return null;

  const canAdd = groups.every((g) => !g.required || selected[g.id]);

  function pickOption(group: MenuItemOptionGroup, optionId: string) {
    setSelected((s) => ({ ...s, [group.id]: optionId }));
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addToCart() {
    if (!item || !storeOpen) return;
    const optionIds = groups.map((g) => selected[g.id]).filter(Boolean);
    const optionNames = groups
      .map((g) => g.options.find((o) => o.id === selected[g.id])?.name)
      .filter(Boolean) as string[];
    const addonNames = addonIds
      .map((id) => addons.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];
    const parts = [...optionNames, ...addonNames];
    const optionsLabel = parts.length ? `${item.name} (${parts.join(", ")})` : item.name;
    addConfigured({
      item,
      price: unitPrice,
      quantity: qty,
      optionIds,
      addonIds,
      optionsLabel,
      instructions,
      openDrawer: false,
    });
    close();
  }

  async function shareItem() {
    if (!item) return;
    const url = `${window.location.origin}/?item=${encodeURIComponent(item.id)}`;
    const shareData = {
      title: `${item.name} · Ubaid Fast Foodz`,
      text: item.description || item.name,
      url,
    };

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const canShare =
          typeof navigator.canShare !== "function" || navigator.canShare(shareData);
        if (canShare) {
          await navigator.share(shareData);
          setShareStatus("shared");
          window.setTimeout(() => setShareStatus("idle"), 2000);
          return;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${url}`);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const basePrice = Number(item.price);
  const showBaseStrike = menuItemHasDiscount(item) && !groups.length;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={close} />
      <div className="relative flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl md:flex-row">
        {/* Image panel */}
        <div className="relative h-52 w-full shrink-0 md:h-auto md:min-h-[28rem] md:w-[42%]">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-stone-950/20" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden">
            <p className="font-display text-2xl text-white">{item.name}</p>
          </div>
        </div>

        {/* Details panel */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div className="min-w-0">
              <h2 className="hidden font-display text-2xl text-stone-900 md:block">{item.name}</h2>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-brand-700">{pkr(unitPrice)}</span>
                {showBaseStrike && (
                  <span className="text-sm text-stone-400 line-through">{pkr(basePrice)}</span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">{item.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => shareItem()}
                  className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100"
                  aria-label="Share item"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              {shareStatus !== "idle" && (
                <p className="text-[10px] font-semibold text-brand-600" role="status">
                  {shareStatus === "copied" ? "Link copied!" : "Shared!"}
                </p>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="mb-2.5 text-sm font-bold text-stone-800">{group.name}</p>
                <div className="space-y-2">
                  {group.options.map((opt) => {
                    const active = selected[group.id] === opt.id;
                    const optDisc =
                      opt.discountPrice != null && Number(opt.discountPrice) < Number(opt.price);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => pickOption(group, opt.id)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition ${
                          active
                            ? "border-brand-500 bg-brand-50/60"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                              active ? "border-brand-600" : "border-stone-300"
                            }`}
                          >
                            {active && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                          </span>
                          <span className="text-sm font-semibold text-stone-800">{opt.name}</span>
                        </span>
                        <span className="text-right">
                          {optDisc && (
                            <span className="mr-1.5 text-xs text-stone-400 line-through">
                              {pkr(opt.price)}
                            </span>
                          )}
                          <span className="text-sm font-bold text-brand-700">{pkr(optionPrice(opt))}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {addons.length > 0 && (
              <div>
                <p className="mb-2.5 text-sm font-bold text-stone-800">Add extras</p>
                <div className="space-y-2">
                  {addons.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={addonIds.includes(a.id)}
                          onChange={() => toggleAddon(a.id)}
                          className="accent-brand-600"
                        />
                        {a.name}
                      </span>
                      <span className="text-sm font-bold text-brand-700">+{pkr(a.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-bold text-stone-800">Special instructions</p>
              <textarea
                className="input min-h-24 resize-none text-sm"
                placeholder="e.g. extra spicy, no onions, well done…"
                maxLength={500}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                aria-label="Special instructions for this item"
              />
              <p className="mt-1 text-right text-xs text-stone-400">
                {instructions.trim() ? "Saved with this item when you add to cart · " : ""}
                {instructions.length}/500
              </p>
            </div>
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
              disabled={!canAdd || !item.isAvailable || !storeOpen}
              onClick={addToCart}
              className="btn-primary h-12 flex-1 text-base font-bold"
            >
              {!storeOpen
                ? "Closed for orders"
                : `${pkr(unitPrice * qty)} | Add to Cart →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
