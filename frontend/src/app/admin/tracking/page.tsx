"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { pkr, formatWhen } from "@/lib/format";
import { AdminStats } from "@/lib/admin-types";
import { Order, OrderStatus, STATUS_LABEL, STATUS_FLOW } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { StatusBadge } from "@/components/admin/StatusBadge";

const COLUMNS: { status: OrderStatus; color: string }[] = [
  { status: "PENDING", color: "border-t-amber-500" },
  { status: "PREPARING", color: "border-t-blue-500" },
  { status: "OUT_FOR_DELIVERY", color: "border-t-violet-500" },
  { status: "DELIVERED", color: "border-t-emerald-500" },
];

export default function TrackingPage() {
  const load = useCallback(() => api<Order[]>("/orders"), []);
  const { data: orders, loading, refresh } = usePoll(load, 8000);

  async function advance(id: string, current: OrderStatus) {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    await api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    refresh();
  }

  const byStatus = (s: OrderStatus) => (orders || []).filter((o) => o.status === s);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Live tracking</h1>
          <p className="mt-1 text-sm text-stone-500">Kitchen board — updates every 8 seconds</p>
        </div>
        <button onClick={refresh} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold">
          Refresh
        </button>
      </div>

      {loading && <div className="skeleton h-96" />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(({ status, color }) => {
          const list = byStatus(status);
          return (
            <div key={status} className={`rounded-2xl border border-stone-200 border-t-4 bg-white shadow-sm ${color}`}>
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <h2 className="text-sm font-bold">{STATUS_LABEL[status]}</h2>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold">{list.length}</span>
              </div>
              <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
                {list.length === 0 && (
                  <p className="py-8 text-center text-xs text-stone-400">No orders here</p>
                )}
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{o.orderNumber}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{formatWhen(o.createdAt)}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-700">{pkr(o.total)}</p>
                    <p className="mt-1 text-xs text-stone-600 line-clamp-1">{o.customerName} · {o.deliveryAddress}</p>
                    {o.rider && <p className="mt-1 text-xs text-violet-700">🛵 {o.rider.name}</p>}
                    {status !== "DELIVERED" && STATUS_FLOW.indexOf(status) < STATUS_FLOW.length - 1 && (
                      <button
                        onClick={() => advance(o.id, status)}
                        className="mt-2 w-full rounded-lg bg-brand-600 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        Move to {STATUS_LABEL[STATUS_FLOW[STATUS_FLOW.indexOf(status) + 1]]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
