"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, downloadInvoice } from "@/lib/api";
import { formatWhen, pkr } from "@/lib/format";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";

type Rider = { id: string; name: string; phone?: string | null };

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);

  async function load() {
    const [o, stats] = await Promise.all([
      api<Order[]>("/orders"),
      api<{ riders: Rider[] }>("/admin/stats"),
    ]);
    setOrders(o);
    setRiders(stats.riders);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: OrderStatus) {
    await api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  async function assign(id: string, riderId: string) {
    await api(`/orders/${id}/assign`, { method: "PATCH", body: JSON.stringify({ riderId }) });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Incoming orders</h1>
      <div className="mt-6 space-y-3">
        {orders.length === 0 && (
          <div className="card px-6 py-16 text-center">
            <p className="font-display text-2xl">Quiet kitchen</p>
            <p className="text-sm text-stone-500">New orders will land here in real time for the demo.</p>
          </div>
        )}
        {orders.map((o) => (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{o.orderNumber}</p>
                <p className="text-sm text-stone-500">
                  {o.customerName} · {o.customerPhone}
                </p>
                <p className="text-xs text-stone-400">{formatWhen(o.createdAt)}</p>
              </div>
              <p className="font-display text-2xl text-brand-700">{pkr(o.total)}</p>
            </div>
            <p className="mt-2 text-sm text-stone-600">{o.deliveryAddress}</p>
            <ul className="mt-2 text-sm text-stone-500">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}× {i.nameAtOrder}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                className="input max-w-[200px] py-2"
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                className="input max-w-[200px] py-2"
                value={o.riderId || ""}
                onChange={(e) => assign(o.id, e.target.value)}
              >
                <option value="">Assign rider</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {(o.status === "DELIVERED" || o.invoice) && (
                <button className="btn-ghost py-2" onClick={() => downloadInvoice(o.id)}>
                  <Download size={14} /> Invoice
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
