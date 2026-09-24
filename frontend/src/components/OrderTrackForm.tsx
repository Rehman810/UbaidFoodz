"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { saveGuestOrderToken } from "@/lib/guest-order";
import { Order } from "@/lib/types";

export function OrderTrackForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const order = await api<Order & { guestAccessToken?: string }>("/orders/track", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: orderNumber.trim().toUpperCase(),
          phone: phone.trim(),
        }),
      });
      if (order.guestAccessToken) {
        saveGuestOrderToken(order.id, order.guestAccessToken);
        router.push(`/orders/${order.id}?token=${encodeURIComponent(order.guestAccessToken)}`);
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-3xl border border-orange-100 bg-white shadow-sm ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <PackageSearch size={20} />
        </span>
        <div>
          <h2 className="font-display text-xl text-stone-900">Track your order</h2>
          <p className="mt-1 text-sm text-stone-500">
            Enter your order number and phone — no account needed.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Order number
          </label>
          <input
            className="input"
            placeholder="e.g. UF-1043"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Phone used at checkout
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
            <span className="grid w-12 shrink-0 place-items-center border-r border-stone-100 bg-stone-50 text-stone-400">
              <Phone size={16} />
            </span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-stone-400"
              placeholder="03xx-xxxxxxx"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary mt-6 h-12 w-full" disabled={busy}>
        {busy ? "Looking up…" : "Track order"}
      </button>
    </form>
  );
}
