"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/api";
import { buildPosOrderPayload, posCartTotal, usePosCart } from "@/lib/pos-cart";
import { buildQuickAddConfig, itemHasConfigurableOptions, menuItemPrice } from "@/lib/menu-price";
import { printReceipt } from "@/lib/print-receipt";
import { pkr } from "@/lib/format";
import { Deal, DeliveryArea, FulfillmentType, MenuItem, Order, PaymentMethod } from "@/lib/types";
import { PosItemSheet } from "@/components/admin/PosItemSheet";

type PosMode = FulfillmentType;

const MODES: { id: PosMode; label: string }[] = [
  { id: "DINE_IN", label: "Dine-in" },
  { id: "PICKUP", label: "Takeaway" },
  { id: "DELIVERY", label: "Delivery" },
];

export default function PosPage() {
  const lines = usePosCart((s) => s.lines);
  const addItem = usePosCart((s) => s.addItem);
  const addDeal = usePosCart((s) => s.addDeal);
  const setQty = usePosCart((s) => s.setQty);
  const remove = usePosCart((s) => s.remove);
  const clear = usePosCart((s) => s.clear);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<PosMode>("DINE_IN");
  const [customerName, setCustomerName] = useState("Walk-in");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [areaId, setAreaId] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [configItem, setConfigItem] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [store, setStore] = useState({ name: "Ubaid Fast Foodz", phone: "", address: "" });

  const load = useCallback(async () => {
    const [m, d, a, s] = await Promise.all([
      api<MenuItem[]>("/menu"),
      api<Deal[]>("/deals"),
      api<DeliveryArea[]>("/delivery-areas"),
      api<{ settings: { phone: string; address: string } }>("/settings/public").catch(() => null),
    ]);
    setMenu(m.filter((i) => i.isAvailable));
    setDeals(d.filter((x) => x.isActive));
    setAreas(a.filter((x) => x.isDelivering));
    if (a[0]) setAreaId(a[0].id);
    if (s?.settings) {
      setStore({ name: "Ubaid Fast Foodz", phone: s.settings.phone, address: s.settings.address });
    }
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load menu."));
  }, [load]);

  const categories = useMemo(() => {
    const cats = [...new Set(menu.map((m) => m.category))].sort();
    return ["All", ...cats];
  }, [menu]);

  const filtered = useMemo(() => {
    let list = menu;
    if (category !== "All") list = list.filter((m) => m.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [menu, category, search]);

  const subtotal = posCartTotal(lines);
  const deliveryFee =
    mode === "DELIVERY" ? Number(areas.find((a) => a.id === areaId)?.deliveryCharge || 0) : 0;
  const total = subtotal + deliveryFee;

  function tapItem(item: MenuItem) {
    if (itemHasConfigurableOptions(item) || (item.optionGroups?.length ?? 0) > 0) {
      setConfigItem(item);
      return;
    }
    const cfg = buildQuickAddConfig(item);
    addItem({
      item,
      price: cfg.price,
      optionIds: cfg.optionIds,
      optionsLabel: cfg.optionsLabel,
    });
  }

  async function placeOrder() {
    setError("");
    if (!lines.length) {
      setError("Add items to the cart first.");
      return;
    }
    if (mode === "DELIVERY" && !areaId) {
      setError("Select a delivery area.");
      return;
    }
    setBusy(true);
    try {
      const payload = buildPosOrderPayload(lines);
      const order = await api<Order>("/pos", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          fulfillmentType: mode,
          deliveryAreaId: mode === "DELIVERY" ? areaId : undefined,
          deliveryAddress: mode === "DELIVERY" ? deliveryAddress : undefined,
          customerName,
          customerPhone: customerPhone || undefined,
          tableNumber: mode === "DINE_IN" ? tableNumber : undefined,
          notes,
          paymentMethod: payment,
          paymentStatus: "PAID",
        }),
      });
      setLastOrder(order);
      clear();
      setNotes("");
      printReceipt(order, store);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setBusy(false);
    }
  }

  async function reprintLast() {
    if (!lastOrder) return;
    try {
      const data = await api<{ order: Order; store: typeof store }>(`/pos/receipt/${lastOrder.id}`);
      printReceipt(data.order, data.store);
    } catch {
      printReceipt(lastOrder, store);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 lg:-m-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
            <Receipt size={20} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Point of Sale</h1>
            <p className="text-xs text-stone-500">Counter orders · prints to thermal printer</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                mode === m.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_360px]">
        {/* Menu */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 p-3">
            <div className="relative min-w-[180px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm"
                placeholder="Search menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                    category === c ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {deals.length > 0 && (
            <div className="border-b border-stone-100 px-3 py-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase text-stone-400">Deals</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {deals.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => addDeal(d)}
                    className="shrink-0 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-left text-xs font-semibold text-brand-800"
                  >
                    {d.title} · {pkr(d.dealPrice)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => tapItem(item)}
                className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50 text-left transition hover:border-brand-300 hover:bg-brand-50/50 active:scale-[0.98]"
              >
                <div className="relative aspect-[4/3] bg-stone-200">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-400">
                      <UtensilsCrossed size={24} />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-bold text-stone-900">{item.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-700">{pkr(menuItemPrice(item))}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-stone-500" />
              <h2 className="font-bold text-stone-900">Current order</h2>
            </div>
          </div>

          <div className="space-y-2 border-b border-stone-100 p-3">
            <input
              className="input h-9 text-sm"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="input h-9 text-sm"
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {mode === "DINE_IN" && (
              <input
                className="input h-9 text-sm"
                placeholder="Table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            )}
            {mode === "DELIVERY" && (
              <>
                <select className="input h-9 text-sm" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (+{pkr(a.deliveryCharge)})
                    </option>
                  ))}
                </select>
                <input
                  className="input h-9 text-sm"
                  placeholder="Delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </>
            )}
            <input
              className="input h-9 text-sm"
              placeholder="Order notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {lines.length === 0 ? (
              <li className="py-8 text-center text-sm text-stone-400">Tap menu items to add</li>
            ) : (
              lines.map((l) => (
                <li key={l.id} className="flex items-start gap-2 rounded-xl bg-stone-50 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-900">{l.name}</p>
                    {l.optionsLabel && l.optionsLabel !== l.name && (
                      <p className="text-[10px] text-stone-500">{l.optionsLabel}</p>
                    )}
                    <p className="text-xs font-bold text-brand-700">{pkr(l.price * l.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200" onClick={() => setQty(l.id, l.quantity - 1)}>
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">{l.quantity}</span>
                    <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200" onClick={() => setQty(l.id, l.quantity + 1)}>
                      <Plus size={12} />
                    </button>
                    <button type="button" className="grid h-7 w-7 place-items-center rounded-lg border border-red-200 text-red-600" onClick={() => remove(l.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-stone-100 p-3">
            <div className="mb-2 space-y-1 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{pkr(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Delivery</span>
                  <span>{pkr(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900">
                <span>Total</span>
                <span className="text-brand-700">{pkr(total)}</span>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayment("CASH")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                  payment === "CASH" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-stone-200"
                }`}
              >
                <Banknote size={14} /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPayment("CARD")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                  payment === "CARD" ? "border-violet-500 bg-violet-50 text-violet-800" : "border-stone-200"
                }`}
              >
                <CreditCard size={14} /> Card
              </button>
            </div>

            <button
              type="button"
              className="btn-primary h-12 w-full text-sm font-bold"
              disabled={busy || !lines.length}
              onClick={placeOrder}
            >
              {busy ? "Placing…" : `Charge & print · ${pkr(total)}`}
            </button>

            {lastOrder && (
              <button
                type="button"
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700"
                onClick={reprintLast}
              >
                <Printer size={14} /> Reprint {lastOrder.orderNumber}
              </button>
            )}
          </div>
        </div>
      </div>

      <PosItemSheet item={configItem} onClose={() => setConfigItem(null)} />
    </div>
  );
}
