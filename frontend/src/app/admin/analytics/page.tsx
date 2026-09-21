"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { AnalyticsData, AnalyticsPeriod } from "@/lib/admin-types";
import { STATUS_LABEL, OrderStatus } from "@/lib/types";
import { STATUS_THEME } from "@/lib/admin-status";
import { usePoll } from "@/hooks/usePoll";
import { formatDateSpanLabel } from "@/lib/order-dates";

const PERIODS: { id: AnalyticsPeriod; label: string; short: string }[] = [
  { id: "today", label: "Today", short: "Today" },
  { id: "week", label: "This week", short: "Week" },
  { id: "month", label: "This month", short: "Month" },
  { id: "year", label: "This year", short: "Year" },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const orders = payload.find((p) => p.dataKey === "orders")?.value;
  const revenue = payload.find((p) => p.dataKey === "revenue")?.value;
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 shadow-float">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <div className="mt-2 space-y-1">
        {orders !== undefined && (
          <p className="text-sm text-stone-700">
            <span className="font-bold text-stone-900">{orders}</span> orders
          </p>
        )}
        {revenue !== undefined && (
          <p className="text-sm text-stone-700">
            <span className="font-bold text-brand-700">{pkr(revenue)}</span> earned
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "stone",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "brand" | "stone" | "emerald";
}) {
  const accents = {
    brand: "border-brand-500 bg-brand-50/40 text-brand-700",
    stone: "border-stone-300 bg-stone-50 text-stone-600",
    emerald: "border-emerald-500 bg-emerald-50/50 text-emerald-700",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 ${accent === "brand" ? "bg-brand-500" : accent === "emerald" ? "bg-emerald-500" : "bg-stone-300"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${accents[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-stone-200/80 bg-white shadow-sm ${className}`}>
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="font-semibold text-stone-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const fetchAnalytics = useCallback(
    () => api<AnalyticsData>(`/admin/analytics?period=${period}`),
    [period]
  );

  const { data, loading, refresh } = usePoll(fetchAnalytics, 30000);

  const chartTitle = useMemo(() => {
    if (period === "today") return "Hourly sales";
    if (period === "week") return "Daily sales";
    if (period === "month") return "Daily sales";
    return "Monthly sales";
  }, [period]);

  const insights = useMemo(() => {
    if (!data) return null;
    const peak = [...data.chart].sort((a, b) => b.revenue - a.revenue)[0];
    const topCat = data.categoryBreakdown[0];
    const topItem = data.topItems[0];
    const deliveryRate = data.orders > 0 ? Math.round((data.delivered / data.orders) * 100) : 0;
    return { peak, topCat, topItem, deliveryRate };
  }, [data]);

  const statusRows = data
    ? (Object.entries(data.statusBreakdown) as [OrderStatus, number][])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({
          status,
          count,
          label: STATUS_LABEL[status],
          theme: STATUS_THEME[status],
        }))
    : [];

  const statusTotal = statusRows.reduce((s, r) => s + r.count, 0);
  const hasChartData = data?.chart.some((d) => d.revenue > 0 || d.orders > 0);
  const maxTopQty = data?.topItems[0]?.qty || 1;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* Toolbar */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-md shadow-brand-500/25">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Analytics</h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
                <CalendarDays size={14} className="text-stone-400" />
                {data ? formatDateSpanLabel(data.range.from, data.range.to) : "Loading…"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    period === p.id
                      ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200/80"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <span className="hidden sm:inline">{p.label}</span>
                  <span className="sm:hidden">{p.short}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-[420px] rounded-2xl" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={pkr(data.revenue)}
              hint={data.periodLabel}
              icon={TrendingUp}
              accent="brand"
            />
            <KpiCard label="Orders" value={data.orders} hint="Non-cancelled" icon={ClipboardList} />
            <KpiCard label="Average order" value={pkr(data.avgOrderValue)} icon={ShoppingBag} />
            <KpiCard
              label="Delivered"
              value={data.delivered}
              hint={`${data.customers} unique customers`}
              icon={PackageCheck}
              accent="emerald"
            />
          </div>

          {/* Insight strip */}
          {insights && (insights.peak?.revenue > 0 || insights.topItem) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {insights.peak && insights.peak.revenue > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50/80 to-white px-4 py-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-800">Best performing slot</p>
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {insights.peak.label} · {pkr(insights.peak.revenue)}
                    </p>
                  </div>
                </div>
              )}
              {insights.topItem && (
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-sm">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-500">Top item</p>
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {insights.topItem.name} · {insights.topItem.qty} sold
                    </p>
                  </div>
                </div>
              )}
              {insights.topCat && (
                <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-sm">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">
                    <BarChart3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-stone-500">Top category</p>
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {insights.topCat.category} · {pkr(insights.topCat.revenue)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bento main */}
          <div className="grid gap-5 xl:grid-cols-12">
            <Panel title={chartTitle} subtitle="Bars show orders · shaded area shows revenue" className="xl:col-span-8">
              <div className="h-[340px]">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.chart} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f4" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#a8a29e" }}
                        interval={period === "month" ? Math.max(0, Math.floor(data.chart.length / 6) - 1) : 0}
                      />
                      <YAxis
                        yAxisId="orders"
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#d6d3d1" }}
                        width={28}
                      />
                      <YAxis
                        yAxisId="rev"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#d6d3d1" }}
                        tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                        width={36}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(234, 88, 12, 0.06)" }} />
                      <Bar
                        yAxisId="orders"
                        dataKey="orders"
                        fill="#fdba74"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={period === "year" ? 36 : 22}
                      />
                      <Area
                        yAxisId="rev"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ea580c"
                        strokeWidth={2}
                        fill="url(#analyticsArea)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#c2410c", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-xl bg-stone-50 text-center">
                    <ShoppingBag size={36} className="text-stone-300" />
                    <p className="mt-3 font-medium text-stone-600">No sales in this period</p>
                    <p className="mt-1 text-sm text-stone-400">Pick another date range above</p>
                  </div>
                )}
              </div>
            </Panel>

            <div className="flex flex-col gap-5 xl:col-span-4">
              {/* Summary ring card */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">At a glance</p>
                <div className="mt-4 flex items-center gap-5">
                  <div className="relative grid h-24 w-24 shrink-0 place-items-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f4" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(insights?.deliveryRate || 0) * 2.64} 264`}
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-xl font-bold text-stone-900">{insights?.deliveryRate || 0}%</p>
                      <p className="text-[10px] font-medium text-stone-400">delivered</p>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs text-stone-500">Total orders</p>
                      <p className="text-lg font-bold text-stone-900">{statusTotal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Customers</p>
                      <p className="text-lg font-bold text-stone-900">{data.customers}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Panel title="Order status" subtitle={`${statusTotal} total`}>
                {statusRows.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {statusRows.map((row) => (
                      <div
                        key={row.status}
                        className={`rounded-xl border px-3 py-3 ${row.theme.border} ${row.theme.bg}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${row.theme.dot}`} />
                          <span className={`text-[11px] font-medium ${row.theme.text}`}>{row.label}</span>
                        </div>
                        <p className={`mt-1.5 text-2xl font-bold ${row.theme.text}`}>{row.count}</p>
                        <p className="text-[10px] text-stone-500">
                          {statusTotal > 0 ? Math.round((row.count / statusTotal) * 100) : 0}% of orders
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-stone-500">No orders yet</p>
                )}
              </Panel>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-5 lg:grid-cols-5">
            <Panel
              title="Best sellers"
              subtitle="Ranked by quantity sold"
              className="lg:col-span-3"
            >
              {data.topItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-stone-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-left text-xs font-medium text-stone-500">
                        <th className="px-4 py-2.5 w-10">#</th>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5 text-right">Qty</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topItems.slice(0, 8).map((item, i) => (
                        <tr key={item.name} className="border-t border-stone-100 transition hover:bg-stone-50/80">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${
                                i === 0 ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600"
                              }`}
                            >
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-900">{item.name}</p>
                            <div className="mt-1.5 h-1 max-w-[200px] overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full rounded-full bg-brand-500"
                                style={{ width: `${Math.round((item.qty / maxTopQty) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-stone-700">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-700">
                            {pkr(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-stone-500">No items sold</p>
              )}
            </Panel>

            <Panel title="Categories" subtitle="Revenue by menu section" className="lg:col-span-2">
              {data.categoryBreakdown.length > 0 ? (
                <ul className="space-y-4">
                  {data.categoryBreakdown.map((cat, i) => {
                    const maxRev = data.categoryBreakdown[0]?.revenue || 1;
                    const pct = Math.round((cat.revenue / maxRev) * 100);
                    return (
                      <li key={cat.category}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-stone-800">{cat.category}</span>
                          <span className="text-sm font-bold text-brand-700">{pkr(cat.revenue)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-orange-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-stone-400">
                          {cat.orders} items · {i === 0 ? "leading category" : `${pct}% of top`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-stone-500">No category data</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
