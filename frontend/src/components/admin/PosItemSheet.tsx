"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { usePosCart } from "@/lib/pos-cart";
import { menuItemPrice, optionPrice } from "@/lib/menu-price";
import { pkr } from "@/lib/format";
import { MenuItem } from "@/lib/types";

export function PosItemSheet({
  item,
  onClose,
}: {
  item: MenuItem | null;
  onClose: () => void;
}) {
  const addItem = usePosCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [addons, setAddons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!item) return;
    setQty(1);
    setAddons(new Set());
    const defaults: Record<string, string> = {};
    for (const g of item.optionGroups ?? []) {
      if (g.options[0]) defaults[g.id] = g.options[0].id;
    }
    setSelected(defaults);
  }, [item?.id]);

  const { unitPrice, labels, optionIds, addonIds } = useMemo(() => {
    if (!item) return { unitPrice: 0, labels: [] as string[], optionIds: [] as string[], addonIds: [] as string[] };
    let price = 0;
    const lbl: string[] = [];
    const ids: string[] = [];
    const groups = item.optionGroups ?? [];

    if (groups.length) {
      for (const g of groups) {
        const optId = selected[g.id];
        const opt = g.options.find((o) => o.id === optId);
        if (opt) {
          price += optionPrice(opt);
          lbl.push(opt.name);
          ids.push(opt.id);
        }
      }
    } else {
      price = menuItemPrice(item);
    }

    const addonList: string[] = [];
    for (const a of item.addons ?? []) {
      if (addons.has(a.id)) {
        price += Number(a.price);
        lbl.push(a.name);
        addonList.push(a.id);
      }
    }

    return { unitPrice: price, labels: lbl, optionIds: ids, addonIds: addonList };
  }, [item, selected, addons]);

  if (!item) return null;

  function submit() {
    if (!item) return;
    for (const g of item.optionGroups ?? []) {
      if (g.required && !selected[g.id]) return;
    }
    addItem({
      item,
      price: unitPrice,
      quantity: qty,
      optionIds,
      addonIds,
      optionsLabel: labels.join(", "),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-stone-950/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-stone-900">{item.name}</h3>
            <p className="text-sm text-brand-700">{pkr(unitPrice)} each</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-stone-200">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-4 overflow-y-auto">
          {item.optionGroups?.map((g) => (
            <div key={g.id}>
              <p className="text-xs font-bold uppercase text-stone-500">{g.name}{g.required ? " *" : ""}</p>
              <div className="mt-1.5 space-y-1">
                {g.options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-3 py-2">
                    <span className="text-sm">{o.name} · {pkr(optionPrice(o))}</span>
                    <input
                      type="radio"
                      name={g.id}
                      checked={selected[g.id] === o.id}
                      onChange={() => setSelected({ ...selected, [g.id]: o.id })}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          {item.addons?.length ? (
            <div>
              <p className="text-xs font-bold uppercase text-stone-500">Add-ons</p>
              <div className="mt-1.5 space-y-1">
                {item.addons.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 px-3 py-2">
                    <span className="text-sm">{a.name} (+{pkr(a.price)})</span>
                    <input
                      type="checkbox"
                      checked={addons.has(a.id)}
                      onChange={() => {
                        const next = new Set(addons);
                        if (next.has(a.id)) next.delete(a.id);
                        else next.add(a.id);
                        setAddons(next);
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-stone-200">
            <button type="button" className="px-3 py-2 font-bold" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="min-w-[2rem] text-center font-bold">{qty}</span>
            <button type="button" className="px-3 py-2 font-bold" onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button type="button" className="btn-primary h-11 flex-1" onClick={submit}>
            Add · {pkr(unitPrice * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
