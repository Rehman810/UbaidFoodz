"use client";

import { useCallback } from "react";
import { Bike, MapPin, Package, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { pkr, formatWhen } from "@/lib/format";
import { AdminRider } from "@/lib/admin-types";
import { usePoll } from "@/hooks/usePoll";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function RidersPage() {
  const load = useCallback(() => api<AdminRider[]>("/admin/riders"), []);
  const { data: riders, loading, refresh } = usePoll(load, 10000);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Riders</h1>
          <p className="mt-1 text-sm text-stone-500">Delivery fleet — live assignments</p>
        </div>
        <button onClick={refresh} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold">
          Refresh
        </button>
      </div>

      {loading && <div className="skeleton h-40" />}

      <div className="grid gap-5 lg:grid-cols-2">
        {riders?.map((r) => (
          <article key={r.id} className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-stone-100 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                <Bike size={22} />
              </span>
              <div className="flex-1">
                <p className="font-bold">{r.name}</p>
                <p className="flex items-center gap-1 text-xs text-stone-500">
                  <Phone size={12} /> {r.phone || "No phone"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-emerald-600">{r.deliveredCount} delivered</p>
                <p className="text-xs text-stone-400">{r.totalAssigned} total assigned</p>
              </div>
            </div>

            <div className="p-5">
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-400">
                <Package size={12} /> Active deliveries ({r.activeOrders.length})
              </p>
              {r.activeOrders.length === 0 ? (
                <p className="mt-4 rounded-xl bg-stone-50 py-6 text-center text-sm text-stone-400">
                  No active drops — assign from Orders
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {r.activeOrders.map((o) => (
                    <li key={o.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{o.orderNumber}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{formatWhen(o.createdAt)} · {pkr(o.total)}</p>
                      <p className="mt-1 flex items-start gap-1 text-xs text-stone-600">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        {o.deliveryAddress}
                      </p>
                      <p className="mt-1 text-xs">{o.customerName} · {o.customerPhone}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
