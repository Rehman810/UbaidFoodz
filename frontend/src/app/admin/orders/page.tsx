"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats } from "@/lib/admin-types";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { OrderPanel } from "@/components/admin/OrderPanel";

const FILTERS: (OrderStatus | "ALL")[] = ["ALL", "PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function AdminOrders() {
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const [orders, stats] = await Promise.all([
      api<Order[]>("/orders"),
      api<AdminStats>("/admin/stats"),
    ]);
    return { orders, riders: stats.riders };
  }, []);

  const { data, loading, refresh } = usePoll(load, 10000);

  async function setStatus(id: string, status: OrderStatus) {
    await api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    refresh();
  }

  async function assign(id: string, riderId: string) {
    await api(`/orders/${id}/assign`, { method: "PATCH", body: JSON.stringify({ riderId }) });
    refresh();
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.orders;
    if (filter !== "ALL") list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.deliveryAddress.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  const counts = useMemo(() => {
    if (!data) return {};
    const c: Record<string, number> = { ALL: data.orders.length };
    for (const o of data.orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-stone-500">Manage incoming orders, update status, assign riders.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="Search order #, name, phone, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={refresh} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-stone-50">
          Refresh
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === f ? "bg-brand-600 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_LABEL[f]} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      {loading && <div className="skeleton h-40" />}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-stone-700">No orders match</p>
          <p className="mt-1 text-sm text-stone-500">Try a different filter or place a test order from the storefront.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((o) => (
          <OrderPanel key={o.id} order={o} riders={data?.riders || []} onStatus={setStatus} onAssign={assign} />
        ))}
      </div>
    </div>
  );
}
