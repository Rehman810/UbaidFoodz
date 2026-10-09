"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
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
      <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-stone-900 dark:text-stone-100 sm:rounded-3xl">
        {item.imageUrl && (
          <div className="relative h-36 shrink-0 overflow-hidden bg-stone-100">
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900">{item.name}</h3>
            <p className="mt-0.5 text-sm font-semibold text-brand-600">{pkr(unitPrice)} each</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {item.optionGroups?.map((g) => (
            <div key={g.id}>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {g.name}{g.required ? " *" : ""}
              </p>
              <div className="mt-2 grid gap-1.5">
                {g.options.map((o) => {
                  const active = selected[g.id] === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelected({ ...selected, [g.id]: o.id })}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-900 ring-1 ring-brand-200"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <span>{o.name}</span>
                      <span className="font-bold text-stone-700">{pkr(optionPrice(o))}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {item.addons?.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Add-ons</p>
              <div className="mt-2 grid gap-1.5">
                {item.addons.map((a) => {
                  const active = addons.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(addons);
                        if (next.has(a.id)) next.delete(a.id);
                        else next.add(a.id);
                        setAddons(next);
                      }}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <span>{a.name}</span>
                      <span className="font-bold text-stone-700">+{pkr(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-stone-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-stone-200 bg-white shadow-sm">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center text-lg font-bold text-stone-600"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[2.5rem] text-center text-lg font-black tabular-nums">{qty}</span>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center text-lg font-bold text-stone-600"
                onClick={() => setQty(qty + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-bold text-white shadow-lg transition hover:bg-stone-800"
              onClick={submit}
            >
              <Check size={16} />
              Add to order · {pkr(unitPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
