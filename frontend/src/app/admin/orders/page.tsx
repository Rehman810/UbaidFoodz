"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, LayoutGrid, RefreshCw, Search, Sparkles, Table2 } from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import {
  formatDateSpanLabel,
  orderInDateSpan,
  QuickDatePreset,
  quickPresetRange,
} from "@/lib/order-dates";
import { STATUS_THEME } from "@/lib/admin-status";
import { AdminStats } from "@/lib/admin-types";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { OrderDateFilter } from "@/components/admin/OrderDateFilter";
import { OrderDetailSheet } from "@/components/admin/OrderDetailSheet";
import { OrderPanel } from "@/components/admin/OrderPanel";
import { OrderTable } from "@/components/admin/OrderTable";

type OrderView = "grid" | "table";
const VIEW_KEY = "uff-orders-view";

const FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "AWAITING_CONFIRMATION",
  "PENDING",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const FILTER_THEME: Record<OrderStatus | "ALL", { dot: string; active: string; idle: string }> = {
  ALL: { dot: "bg-brand-500", active: "bg-stone-900 text-white shadow-md", idle: "bg-white text-stone-700 ring-stone-200" },
  AWAITING_CONFIRMATION: {
    dot: STATUS_THEME.AWAITING_CONFIRMATION.dot,
    active: "bg-orange-500 text-white shadow-md shadow-orange-200",
    idle: "bg-white text-orange-800 ring-orange-200",
  },
  PENDING: { dot: STATUS_THEME.PENDING.dot, active: "bg-amber-500 text-white shadow-md shadow-amber-200", idle: "bg-white text-amber-800 ring-amber-200" },
  PREPARING: { dot: STATUS_THEME.PREPARING.dot, active: "bg-blue-500 text-white shadow-md shadow-blue-200", idle: "bg-white text-blue-800 ring-blue-200" },
  OUT_FOR_DELIVERY: { dot: STATUS_THEME.OUT_FOR_DELIVERY.dot, active: "bg-violet-500 text-white shadow-md shadow-violet-200", idle: "bg-white text-violet-800 ring-violet-200" },
  DELIVERED: { dot: STATUS_THEME.DELIVERED.dot, active: "bg-emerald-500 text-white shadow-md shadow-emerald-200", idle: "bg-white text-emerald-800 ring-emerald-200" },
  CANCELLED: { dot: STATUS_THEME.CANCELLED.dot, active: "bg-stone-500 text-white shadow-md", idle: "bg-white text-stone-600 ring-stone-200" },
};

const DEFAULT_RANGE = quickPresetRange("today");

export default function AdminOrders() {
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(DEFAULT_RANGE.from);
  const [dateTo, setDateTo] = useState(DEFAULT_RANGE.to);
  const [datePreset, setDatePreset] = useState<QuickDatePreset | null>("today");
  const [view, setView] = useState<OrderView>("table");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "grid" || saved === "table") setView(saved);
  }, []);

  function changeView(next: OrderView) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  const load = useCallback(async () => {
    const [orders, stats] = await Promise.all([
      api<Order[]>("/orders"),
      api<AdminStats>("/admin/stats"),
    ]);
    return { orders, riders: stats.riders };
  }, []);

  const { data, loading, refresh } = usePoll(load, 10000);
  useLiveOrders(refresh);

  async function setStatus(id: string, status: OrderStatus) {
    await api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    refresh();
  }

  async function assign(id: string, riderId: string) {
    await api(`/orders/${id}/assign`, { method: "PATCH", body: JSON.stringify({ riderId }) });
    refresh();
  }

  async function confirmOrder(id: string) {
    await api(`/orders/${id}/confirm`, { method: "PATCH" });
    refresh();
  }

  function handleDateChange(from: string, to: string, preset: QuickDatePreset | null) {
    setDateFrom(from);
    setDateTo(to);
    setDatePreset(preset);
  }

  const dateFiltered = useMemo(() => {
    if (!data) return [];
    return data.orders.filter((o) => orderInDateSpan(o.createdAt, dateFrom, dateTo));
  }, [data, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = dateFiltered;
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
  }, [dateFiltered, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: dateFiltered.length };
    for (const o of dateFiltered) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [dateFiltered]);

  const activeCount =
    (counts.AWAITING_CONFIRMATION || 0) +
    (counts.PENDING || 0) +
    (counts.PREPARING || 0) +
    (counts.OUT_FOR_DELIVERY || 0);
  const filteredRevenue = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const periodLabel = formatDateSpanLabel(dateFrom, dateTo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Orders</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                {periodLabel} · refreshes every 10s · click a row for IP & location
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
              <p className="text-[11px] font-medium text-stone-500">Active</p>
              <p className="text-lg font-semibold text-amber-800">{activeCount}</p>
            </div>
            <div className="rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200">
              <p className="text-[11px] font-medium text-stone-500">Showing</p>
              <p className="text-lg font-semibold text-stone-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl bg-brand-50 px-3 py-2 ring-1 ring-brand-100">
              <p className="text-[11px] font-medium text-stone-500">Value</p>
              <p className="text-lg font-semibold text-brand-800">{pkr(filteredRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <OrderDateFilter
        from={dateFrom}
        to={dateTo}
        activePreset={datePreset}
        onChange={handleDateChange}
        orderCount={dateFiltered.length}
      />

      {/* Search + refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="Search order #, name, phone, address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl bg-stone-100 p-1 ring-1 ring-stone-200">
            <button
              type="button"
              onClick={() => changeView("table")}
              aria-pressed={view === "table"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                view === "table" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Table2 size={15} /> Table
            </button>
            <button
              type="button"
              onClick={() => changeView("grid")}
              aria-pressed={view === "grid"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                view === "grid" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <LayoutGrid size={15} /> Grid
            </button>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-500"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const t = FILTER_THEME[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold ring-1 transition ${
                active ? t.active : `${t.idle} hover:bg-stone-50`
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active && f !== "ALL" ? "bg-white/90" : t.dot}`} />
              {f === "ALL" ? "All" : STATUS_LABEL[f]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-stone-100 text-stone-500"}`}>
                {counts[f] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading &&
        (view === "table" ? (
          <div className="skeleton h-80 rounded-2xl" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-2xl" />
            ))}
          </div>
        ))}

      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-400">
            <Sparkles size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-stone-800">No orders match</p>
          <p className="mt-1 text-sm text-stone-500">
            Try a different date range, status filter, or place a test order from the storefront.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && view === "table" && (
        <OrderTable
          orders={filtered}
          riders={data?.riders || []}
          onStatus={setStatus}
          onAssign={assign}
          onConfirm={confirmOrder}
          onSelect={setSelectedOrder}
        />
      )}

      {selectedOrder && (
        <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {!loading && filtered.length > 0 && view === "grid" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((o) => (
            <OrderPanel
              key={o.id}
              order={o}
              riders={data?.riders || []}
              onStatus={setStatus}
              onAssign={assign}
              onConfirm={confirmOrder}
              onSelect={() => setSelectedOrder(o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
