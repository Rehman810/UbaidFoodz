"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download, CheckCircle2, RotateCcw } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { StatusTrack } from "@/components/StatusTrack";
import { api, downloadInvoice } from "@/lib/api";
import { getGuestOrderToken, orderApiPath, saveGuestOrderToken } from "@/lib/guest-order";
import { useCart } from "@/lib/cart";
import { eta, formatWhen, pkr } from "@/lib/format";
import { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addConfigured = useCart((s) => s.addConfigured);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [guestToken, setGuestToken] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("token");
    const fromSession = getGuestOrderToken(id);
    const token = fromUrl || fromSession;
    if (fromUrl) saveGuestOrderToken(id, fromUrl);
    setGuestToken(token);

    api<Order>(orderApiPath(id, token))
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [id, searchParams]);

  async function repeatOrder() {
    if (!order) return;
    const menu = await api<{ id: string; name: string; imageUrl: string; price: number }[]>(
      "/menu"
    ).catch(() => []);
    for (const line of order.items) {
      const item = menu.find((m) => m.id === line.menuItemId);
      if (!item) continue;
      addConfigured({
        item: {
          id: item.id,
          name: line.nameAtOrder,
          description: "",
          price: item.price,
          category: "",
          imageUrl: item.imageUrl,
          isAvailable: true,
        },
        price: Number(line.priceAtOrder),
        optionsLabel: line.nameAtOrder,
      });
    }
    router.push("/checkout");
  }

  return (
    <StoreShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        {error && <p className="text-red-600">{error}</p>}
        {!order && !error && <div className="skeleton h-72" />}
        {order && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Order confirmed</p>
                <h1 className="font-display text-4xl">{order.orderNumber}</h1>
                <p className="mt-1 text-sm text-stone-500">{formatWhen(order.createdAt)}</p>
              </div>
              <CheckCircle2 className="text-emerald-500" />
            </div>
            <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm">
              Estimated delivery <strong>{eta(order.createdAt)}</strong>
            </p>
            <div className="mt-6">
              <StatusTrack status={order.status} />
            </div>
            <ul className="mt-6 space-y-2 border-t border-orange-100 pt-4 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.quantity}× {i.nameAtOrder}
                  </span>
                  <span>{pkr(Number(i.priceAtOrder) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 text-sm">
              {order.subtotal !== undefined && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <span>{pkr(order.subtotal)}</span>
                </div>
              )}
              {Number(order.deliveryCharge || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">
                    Delivery{order.deliveryArea?.name ? ` · ${order.deliveryArea.name}` : ""}
                  </span>
                  <span>{pkr(order.deliveryCharge!)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-brand-700">{pkr(order.total)}</span>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
            </p>
            <p className="mt-1 text-sm text-stone-500">{order.deliveryAddress}</p>
            {order.notes && <p className="mt-1 text-sm italic text-stone-500">&ldquo;{order.notes}&rdquo;</p>}
            <button className="btn-ghost mt-4 w-full" onClick={repeatOrder}>
              <RotateCcw size={16} /> Order again
            </button>
            {(order.status === "DELIVERED" || order.invoice) && (
              <button className="btn-primary mt-3 w-full" onClick={() => downloadInvoice(order.id, guestToken)}>
                <Download size={16} /> Download invoice
              </button>
            )}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
