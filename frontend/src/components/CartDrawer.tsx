"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cartTotal, useCart } from "@/lib/cart";
import { pkr } from "@/lib/format";

const CLOSE_MS = 340;

export function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const setDrawer = useCart((s) => s.setDrawer);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(items);

  const [render, setRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setVisible(false);
    window.setTimeout(() => {
      closingRef.current = false;
      setDrawer(false);
      setClosing(false);
      setRender(false);
      document.body.style.overflow = "";
    }, CLOSE_MS);
  }, [setDrawer]);

  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;

    setRender(true);
    setClosing(false);
    document.body.style.overflow = "hidden";

    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(r1);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-hidden={closing}>
      <button
        type="button"
        aria-label="Close cart"
        className={`drawer-backdrop absolute inset-0 bg-stone-900/40 backdrop-blur-sm ${
          visible && !closing ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className={`drawer-panel relative flex h-full w-full max-w-md flex-col bg-[#fffaf5] shadow-float ${
          visible && !closing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
          <div>
            <p className="font-display text-2xl">Your bag</p>
            <p className="text-xs text-stone-500">{items.length} item(s)</p>
          </div>
          <button onClick={close} className="btn-ghost h-10 px-3">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand-100 text-brand-700">
                  <ShoppingBag />
                </div>
                <p className="font-display text-xl">Bag is empty</p>
                <p className="mt-1 text-sm text-stone-500">Add a zinger, biryani or lava cake to get started.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    {item.kind === "deal" ? (
                      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">Combo deal</p>
                    ) : null}
                    <p className="text-sm text-brand-700">{pkr(item.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-brand-50" onClick={() => setQty(item.id, item.quantity - 1)}>
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                      <button className="grid h-7 w-7 place-items-center rounded-full bg-brand-50" onClick={() => setQty(item.id, item.quantity + 1)}>
                        <Plus size={12} />
                      </button>
                      <button className="ml-auto text-stone-400 hover:text-red-500" onClick={() => remove(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-orange-100 p-5">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-stone-500">Subtotal</span>
            <span className="font-semibold">{pkr(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={close}
            className={`btn-primary w-full ${items.length === 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            Place order
          </Link>
        </div>
      </aside>
    </div>
  );
}
