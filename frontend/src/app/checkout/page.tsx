"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bike, ExternalLink, MapPin, ShieldCheck, Store } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { useAuth } from "@/lib/auth";
import { cartTotal, useCart } from "@/lib/cart";
import { api } from "@/lib/api";
import { saveGuestOrderToken } from "@/lib/guest-order";
import { useFulfillment } from "@/lib/fulfillment";
import { pkr } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useStoreOpen } from "@/lib/use-store-open";
import { Order } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const store = useStore();
  const { isOpen: storeOpen, closedMessage } = useStoreOpen();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = cartTotal(items);
  const {
    hasChosen,
    mode,
    areaId,
    areaName,
    deliveryCharge,
    setOpenModal,
  } = useFulfillment();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isDelivery = mode === "DELIVERY";
  const settings = store?.settings;
  const pickupAddress = settings?.address ?? "Ubaid Fast Foodz — Boat Basin, Clifton Block 5, Karachi";
  const minimumOrder = Number(settings?.minimumOrder ?? 0);
  const freeAbove = settings?.freeDeliveryAbove != null ? Number(settings.freeDeliveryAbove) : null;
  const qualifiesFreeDelivery = freeAbove != null && subtotal >= freeAbove;
  const effectiveDelivery = isDelivery && !qualifiesFreeDelivery ? deliveryCharge : 0;
  const grandTotal = subtotal + effectiveDelivery;
  const belowMinimum = minimumOrder > 0 && subtotal < minimumOrder;
  const storeClosed = !storeOpen;

  const mapsUrl = useMemo(() => {
    if (!settings?.latitude || !settings?.longitude) return null;
    const lat = settings.latitude;
    const lng = settings.longitude;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }, [settings]);

  useEffect(() => {
    if (!hasChosen) setOpenModal(true);
  }, [hasChosen, setOpenModal]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) return;
    if (storeClosed) {
      setError(closedMessage || "We are currently closed.");
      return;
    }
    if (belowMinimum) {
      setError(`Minimum order is ${pkr(minimumOrder)}. Add more items to continue.`);
      return;
    }
    if (!hasChosen) {
      setOpenModal(true);
      return;
    }
    if (isDelivery && !areaId) {
      setError("Please select a delivery area.");
      setOpenModal(true);
      return;
    }
    setBusy(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          deliveryAddress: isDelivery ? address : pickupAddress,
          fulfillmentType: mode,
          deliveryAreaId: isDelivery ? areaId : undefined,
          notes,
          items: items
            .filter((i) => !i.kind || i.kind === "item")
            .map((i) => ({
              menuItemId: i.menuItemId || i.id,
              quantity: i.quantity,
              optionIds: i.optionIds,
              addonIds: i.addonIds,
              instructions: i.instructions,
            })),
          deals: items
            .filter((i) => i.kind === "deal" && i.dealId)
            .map((i) => ({ dealId: i.dealId!, quantity: i.quantity })),
        }),
      });
      clear();
      if (order.guestAccessToken) {
        saveGuestOrderToken(order.id, order.guestAccessToken);
        router.push(`/orders/${order.id}?token=${encodeURIComponent(order.guestAccessToken)}`);
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  const estimateMin = isDelivery
    ? settings?.deliveryEstimateMin ?? 45
    : settings?.pickupEstimateMin ?? 20;

  return (
    <StoreShell>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="space-y-4">
          <h1 className="font-display text-4xl">Checkout</h1>
          <p className="text-sm text-stone-500">No account needed — just your details.</p>

          {storeClosed && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {closedMessage}
            </p>
          )}
          {belowMinimum && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Minimum order is {pkr(minimumOrder)}. Add {pkr(minimumOrder - subtotal)} more to continue.
            </p>
          )}
          {freeAbove != null && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {qualifiesFreeDelivery
                ? "You qualify for free delivery!"
                : `Free delivery on orders above ${pkr(freeAbove)}`}
            </p>
          )}
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white p-4 text-left transition hover:border-brand-200"
          >
            {isDelivery ? (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                <Bike size={18} />
              </span>
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-100 text-stone-700">
                <Store size={18} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{isDelivery ? "Delivery" : "Pickup"}</p>
              <p className="truncate text-xs text-stone-500">
                {isDelivery ? areaName || "Select area" : pickupAddress}
              </p>
              <p className="text-xs text-brand-600">Est. {estimateMin} min</p>
            </div>
            <span className="text-xs font-semibold text-brand-700">Change</span>
          </button>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            <p>Your details are stored securely and only used for your order.</p>
          </div>

          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            className="input"
            placeholder="Phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {isDelivery ? (
            <textarea
              className="input min-h-24"
              placeholder="House / street / landmark in your area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          ) : (
            <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-brand-600" size={16} />
                <p>Pickup from <strong>{pickupAddress}</strong>. We will call when your order is ready.</p>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  Open in Google Maps <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
          <textarea
            className="input min-h-20"
            placeholder="Order notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="btn-primary h-12 w-full"
            disabled={busy || items.length === 0 || storeClosed || belowMinimum}
          >
            {busy ? "Placing…" : `Place order · ${pkr(grandTotal)}`}
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
                    {i.kind === "deal" && (
                      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">Combo deal</p>
                    )}
                    <p className="text-stone-500">
                      {i.quantity} × {pkr(i.price)}
                    </p>
                    {i.instructions ? (
                      <p className="mt-0.5 text-xs text-stone-500">
                        <span className="font-medium text-stone-600">Note:</span> {i.instructions}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-2 border-t border-orange-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Subtotal</span>
              <span>{pkr(subtotal)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery ({areaName})</span>
                <span>
                  {qualifiesFreeDelivery ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    pkr(effectiveDelivery)
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-brand-700">{pkr(grandTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </StoreShell>
  );
}
