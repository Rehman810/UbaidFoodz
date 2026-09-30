"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardList,
  PackageCheck,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { pkr } from "@/lib/format";
import { AdminStats } from "@/lib/admin-types";
import { usePoll } from "@/hooks/usePoll";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { StatCard } from "@/components/admin/StatCard";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { PipelineFlow } from "@/components/admin/PipelineFlow";
import { RecentOrderRow } from "@/components/admin/RecentOrderRow";
import { OrderStatus } from "@/lib/types";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-stone-900">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-brand-700">
          {p.dataKey === "revenue" ? pkr(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const store = useStore();
  const [twoFaHidden, setTwoFaHidden] = useState(false);
  useEffect(() => {
    setTwoFaHidden(sessionStorage.getItem("ros-2fa-dismiss") === "1");
  }, []);
  const fetchStats = useCallback(() => api<AdminStats>("/admin/stats"), []);
  const { data: stats, loading, refreshing, refresh } = usePoll(fetchStats, 12000);
  useLiveOrders(refresh);
  const showSkeleton = loading || refreshing;

  async function setStatus(id: string, status: OrderStatus) {
    await api(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    refresh();
  }

  async function assign(id: string, riderId: string) {
    await api(`/orders/${id}/assign`, { method: "PATCH", body: JSON.stringify({ riderId }) });
    refresh();
  }

  async function toggleKitchen() {
    const manuallyClosed = Boolean(store?.settings.forceClosed);
    const open = Boolean(store?.isOpen);
    if (!open && !manuallyClosed) return;
    await api("/settings", { method: "PATCH", body: JSON.stringify({ forceClosed: open }) });
    window.dispatchEvent(new Event("store-refresh"));
  }

  if (showSkeleton || !stats) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-44 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  const active =
    stats.awaitingConfirmation + stats.pending + stats.preparing + stats.outForDelivery;
  const maxTop = stats.topItems[0]?.qty || 1;

  const needsName = !store?.settings.storeName?.trim();
  const showTwoFa = user?.role === "ADMIN" && !user.totpEnabled && !twoFaHidden;

  return (
    <div className="space-y-6">
      {needsName && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Set your restaurant name before you open the storefront.{" "}
          <Link href="/admin/settings" className="font-bold underline">Open settings</Link>
        </div>
      )}
      {showTwoFa && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
          <p>Two-factor sign-in is off for this admin account.</p>
          <div className="flex gap-2">
            <Link href="/admin/settings" className="font-bold underline">Set up authenticator</Link>
            <button type="button" className="text-xs font-semibold text-stone-500" onClick={() => { sessionStorage.setItem("ros-2fa-dismiss", "1"); setTwoFaHidden(true); }}>Dismiss</button>
          </div>
        </div>
      )}
      {/* Welcome strip */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-brand-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-300">Kitchen command</p>
            <h1 className="font-display mt-2 text-3xl text-white sm:text-4xl">
              Good evening{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-2 max-w-md text-sm text-stone-400">
              {active} bags moving through the kitchen · {stats.deliveredToday} delivered today · refreshes every 12s
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm ring-1 ring-white/10">
              <p className="text-xs text-orange-200">Today&apos;s revenue</p>
              <p className="font-display text-3xl font-bold">{pkr(stats.todayRevenue)}</p>
            </div>
            <button
              type="button"
              onClick={toggleKitchen}
              disabled={store != null && !store.isOpen && !store.settings.forceClosed}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-stone-900 shadow-lg hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {store?.isOpen ? "Close kitchen" : store?.settings.forceClosed ? "Open kitchen" : "Closed by schedule"}
            </button>
            <RefreshButton busy={showSkeleton} onClick={refresh} variant="dark" />
          </div>
        </div>
      </div>

      {/* KPI row — 4 focused metrics, not 8 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's orders" value={stats.todayOrders} icon={ClipboardList} accent="blue" sub="orders" />
        <StatCard label="Avg order value" value={pkr(stats.avgOrderValue)} icon={TrendingUp} accent="emerald" sub="Average" />
        <StatCard label="Delivered today" value={stats.deliveredToday} icon={PackageCheck} accent="emerald" sub="done" />
        <StatCard
          label="POS sales today"
          value={pkr(stats.posTodayRevenue ?? 0)}
          icon={Receipt}
          accent="brand"
          sub={`${stats.posTodayOrders ?? 0} counter orders`}
        />
      </div>

      <PipelineFlow
        active={active}
        steps={[
          { label: "Awaiting call", count: stats.awaitingConfirmation, color: "bg-orange-500", bg: "bg-orange-50/80", ring: "ring-orange-200/60" },
          { label: "Confirmed", count: stats.pending, color: "bg-amber-500", bg: "bg-amber-50/80", ring: "ring-amber-200/60" },
          { label: "Preparing", count: stats.preparing, color: "bg-blue-500", bg: "bg-blue-50/80", ring: "ring-blue-200/60" },
          { label: "On the road", count: stats.outForDelivery, color: "bg-violet-500", bg: "bg-violet-50/80", ring: "ring-violet-200/60" },
          { label: "Delivered today", count: stats.deliveredToday, color: "bg-emerald-500", bg: "bg-emerald-50/80", ring: "ring-emerald-200/60" },
        ]}
      />

      {/* Charts — single rich panel */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-stone-900">Performance</h2>
            <p className="text-sm text-stone-500">Last 7 days · orders & revenue</p>
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Orders
            </span>
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-300" /> Revenue
            </span>
          </div>
        </div>
        <div className="mt-6 h-80 min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <ComposedChart data={stats.chart} barGap={4} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fdba74" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#fdba74" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#57534e", fontWeight: 600 }}
                dy={8}
              />
              <YAxis
                yAxisId="orders"
                allowDecimals={false}
                domain={[0, (max: number) => Math.max(max, 4)]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#57534e" }}
                width={32}
              />
              <YAxis
                yAxisId="rev"
                orientation="right"
                domain={[0, "auto"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#57534e" }}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar yAxisId="orders" dataKey="orders" fill="#ea580c" radius={[8, 8, 0, 0]} maxBarSize={48} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#fb923c" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: "#ea580c", strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Recent orders */}
        <div className="xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-stone-900">Incoming orders</h2>
              <p className="text-sm text-stone-500">Update status inline</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-bold text-brand-700 hover:underline">
              All orders →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 6).map((o) => (
              <RecentOrderRow key={o.id} order={o} riders={stats.riders} onStatus={setStatus} onAssign={assign} />
            ))}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg text-stone-900">Top sellers</h2>
            <ul className="mt-4 space-y-4">
              {stats.topItems.map((item, i) => (
                <li key={item.name}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold text-stone-800">{item.name}</span>
                    <span className="shrink-0 font-bold text-brand-700">{item.qty}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-orange-400 transition-all duration-700"
                      style={{ width: `${(item.qty / maxTop) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-medium text-stone-600">{pkr(item.revenue)} revenue</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Customers", value: stats.customerCount },
              { label: "Menu items", value: stats.menuCount },
              { label: "Total orders", value: stats.totalOrders },
              { label: "Preparing", value: stats.preparing },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-stone-900">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
