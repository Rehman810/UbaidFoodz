"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, CheckCircle2 } from "lucide-react";
import { StoreShell } from "@/components/StoreShell";
import { StatusTrack } from "@/components/StatusTrack";
import { api, downloadInvoice } from "@/lib/api";
import { eta, formatWhen, pkr } from "@/lib/format";
import { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [id]);

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
            <div className="mt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-brand-700">{pkr(order.total)}</span>
            </div>
            <p className="mt-4 text-sm text-stone-500">{order.deliveryAddress}</p>
            {order.notes && <p className="mt-1 text-sm italic text-stone-500">“{order.notes}”</p>}
            {(order.status === "DELIVERED" || order.invoice) && (
              <button className="btn-primary mt-6 w-full" onClick={() => downloadInvoice(order.id)}>
                <Download size={16} /> Download invoice
              </button>
            )}
          </div>
        )}
      </div>
    </StoreShell>
  );
}
