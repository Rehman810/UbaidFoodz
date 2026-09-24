"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { pkr } from "@/lib/format";
import { MenuItem } from "@/lib/types";

export function ItemOptionsModal({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const addConfigured = useCart((s) => s.addConfigured);
  const [sizeId, setSizeId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);

  const sizes = item?.sizes ?? [];
  const addons = item?.addons ?? [];

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    let price = Number(item.effectivePrice ?? item.discountPrice ?? item.price);
    const size = sizes.find((s) => s.id === sizeId);
    if (size) price = Number(size.price);
    for (const id of addonIds) {
      const addon = addons.find((a) => a.id === id);
      if (addon) price += Number(addon.price);
    }
    return price;
  }, [item, sizeId, addonIds, sizes, addons]);

  if (!item) return null;

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirm() {
    if (!item) return;
    const size = sizes.find((s) => s.id === sizeId);
    const addonNames = addonIds
      .map((id) => addons.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];
    const parts = [size?.name, ...addonNames].filter(Boolean);
    const optionsLabel = parts.length ? `${item.name} (${parts.join(", ")})` : item.name;
    addConfigured({
      item,
      price: unitPrice,
      sizeId: sizes.length ? sizeId : undefined,
      addonIds,
      optionsLabel,
    });
    onClose();
  }

  const canAdd = sizes.length === 0 || Boolean(sizeId);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-950/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-float">
        <div className="relative h-40">
          <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h3 className="font-display text-xl">{item.name}</h3>
            <p className="mt-1 text-sm text-stone-500">{item.description}</p>
          </div>

          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      sizeId === s.id ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {s.name} · {pkr(s.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {addons.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Add-ons</p>
              <div className="space-y-2">
                {addons.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={addonIds.includes(a.id)}
                        onChange={() => toggleAddon(a.id)}
                      />
                      {a.name}
                    </span>
                    <span className="text-sm font-semibold text-brand-700">+{pkr(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="button" className="btn-primary h-11 w-full" disabled={!canAdd} onClick={confirm}>
            Add to bag · {pkr(unitPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
