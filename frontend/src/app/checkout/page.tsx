"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StoreShell } from "@/components/StoreShell";
import { useAuth } from "@/lib/auth";
import { cartTotal, useCart } from "@/lib/cart";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { Order } from "@/lib/types";
import { Banknote } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const total = cartTotal(items);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) {
      router.push("/login?next=/checkout");
      return;
    }
    if (items.length === 0) return;
    setBusy(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          deliveryAddress: address,
          notes,
          items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        }),
      });
      clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="space-y-4">
          <h1 className="font-display text-4xl">Checkout</h1>
          <p className="text-sm text-stone-500">Cash on delivery · no card needed for this demo.</p>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {!user && (
            <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
              Sign in as the demo customer to place an order.
            </p>
          )}
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <textarea
            className="input min-h-24"
            placeholder="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <textarea
            className="input min-h-20"
            placeholder="Order notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
            <Banknote className="text-brand-700" />
            <div>
              <p className="text-sm font-semibold">Cash on Delivery</p>
              <p className="text-xs text-stone-500">Pay the rider when your bag arrives.</p>
            </div>
          </div>
          <button className="btn-primary h-12 w-full" disabled={busy || items.length === 0}>
            {busy ? "Placing…" : `Place order · ${pkr(total)}`}
          </button>
        </form>
        <aside className="card h-fit p-5">
          <p className="font-display text-2xl">Bag</p>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Your bag is empty. Add items from the menu first.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                    <Image src={i.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-stone-500">
                      {i.quantity} × {pkr(i.price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex justify-between border-t border-orange-100 pt-4 font-semibold">
            <span>Total</span>
            <span className="text-brand-700">{pkr(total)}</span>
          </div>
        </aside>
      </div>
    </StoreShell>
  );
}
