"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Crown,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { pkr, formatWhen } from "@/lib/format";
import { AdminCustomer } from "@/lib/admin-types";
import { usePoll } from "@/hooks/usePoll";
import { StatusBadge } from "@/components/admin/StatusBadge";

type SortKey = "recent" | "spent" | "orders" | "name";

const AVATAR_GRADIENTS = [
  "from-brand-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Users;
  accent: "brand" | "emerald" | "violet" | "sky";
}) {
  const styles = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${styles[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");

  const load = useCallback(() => api<AdminCustomer[]>("/admin/customers"), []);
  const { data: customers, loading, refresh } = usePoll(load, 30000);

  const stats = useMemo(() => {
    const list = customers ?? [];
    const totalRevenue = list.reduce((s, c) => s + c.totalSpent, 0);
    const totalOrders = list.reduce((s, c) => s + c.orderCount, 0);
    const repeat = list.filter((c) => c.orderCount > 1).length;
    const avgSpend = list.length ? totalRevenue / list.length : 0;
    const topSpender = [...list].sort((a, b) => b.totalSpent - a.totalSpent)[0];
    return {
      count: list.length,
      totalRevenue,
      totalOrders,
      avgSpend,
      repeatRate: list.length ? Math.round((repeat / list.length) * 100) : 0,
      topSpender,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    let list = [...(customers ?? [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }
    list.sort((a, b) => {
      if (sort === "spent") return b.totalSpent - a.totalSpent;
      if (sort === "orders") return b.orderCount - a.orderCount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [customers, search, sort]);

  const topThreshold = stats.topSpender?.totalSpent ?? 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Customers</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Registered accounts, order history, and lifetime value
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white lg:self-auto"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total customers"
          value={stats.count}
          hint={`${stats.totalOrders} orders placed`}
          icon={Users}
          accent="sky"
        />
        <KpiCard
          label="Lifetime revenue"
          value={pkr(stats.totalRevenue)}
          hint="Excludes cancelled"
          icon={Wallet}
          accent="brand"
        />
        <KpiCard
          label="Avg per customer"
          value={pkr(Math.round(stats.avgSpend))}
          hint="Total spend ÷ customers"
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          label="Repeat rate"
          value={`${stats.repeatRate}%`}
          hint="Customers with 2+ orders"
          icon={ShoppingBag}
          accent="violet"
        />
      </div>

      {/* Search & sort */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "spent" as SortKey, label: "Top spenders" },
              { id: "orders" as SortKey, label: "Most orders" },
              { id: "recent" as SortKey, label: "Newest" },
              { id: "name" as SortKey, label: "A–Z" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSort(opt.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  sort === opt.id
                    ? "bg-stone-900 text-white"
                    : "bg-stone-50 text-stone-600 ring-1 ring-stone-200 hover:bg-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Showing {filtered.length} of {stats.count} customers
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Users size={36} className="mx-auto text-stone-300" />
          <p className="mt-3 font-medium text-stone-600">
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {search ? "Try a different name or email." : "Customers appear here after they sign up and order."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, index) => {
            const avgOrder = c.orderCount > 0 ? c.totalSpent / c.orderCount : 0;
            const isTop = index === 0 && sort === "spent" && c.totalSpent > 0 && c.totalSpent >= topThreshold;

            return (
              <article
                key={c.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                  isTop ? "border-brand-200 ring-1 ring-brand-100" : "border-stone-200/80"
                }`}
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  {/* Identity */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${avatarGradient(c.id)}`}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-stone-900">{c.name}</h2>
                        {isTop && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                            <Crown size={10} /> Top customer
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <Mail size={12} className="shrink-0" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} className="shrink-0" /> {c.phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="shrink-0" /> Joined {formatWhen(c.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:w-[420px] lg:shrink-0">
                    <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Orders</p>
                      <p className="mt-0.5 text-lg font-bold text-stone-900">{c.orderCount}</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-3 py-2.5 text-center ring-1 ring-brand-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">Spent</p>
                      <p className="mt-0.5 text-lg font-bold text-brand-800">{pkr(c.totalSpent)}</p>
                    </div>
                    <div className="rounded-xl bg-stone-50 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Avg order</p>
                      <p className="mt-0.5 text-lg font-bold text-stone-900">{pkr(Math.round(avgOrder))}</p>
                    </div>
                  </div>

                  {/* Last order */}
                  <div className="lg:w-[220px] lg:shrink-0">
                    {c.lastOrder ? (
                      <Link
                        href={`/admin/orders`}
                        className="block rounded-xl border border-stone-100 bg-stone-50/80 p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
                      >
                        <p className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-stone-400">
                          <span className="inline-flex items-center gap-1">
                            <ShoppingBag size={11} /> Last order
                          </span>
                          <ArrowUpRight size={12} />
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <StatusBadge status={c.lastOrder.status} />
                          <span className="text-sm font-bold text-stone-900">{pkr(c.lastOrder.total)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-stone-400">{formatWhen(c.lastOrder.createdAt)}</p>
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-3 py-4 text-center text-xs text-stone-400">
                        No orders yet
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
