"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bike,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  Search,
  Truck,
  Users,
} from "lucide-react";
import { fetchRidersPage } from "@/lib/admin-riders";
import { pkr, formatWhen } from "@/lib/format";
import { usePoll } from "@/hooks/usePoll";
import { PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { FulfillmentBadge } from "@/components/FulfillmentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminScopeBanner } from "@/components/admin/AdminScopeBanner";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-brand-500 to-orange-600",
];

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[hash];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
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
  icon: typeof Bike;
  accent: "violet" | "emerald" | "sky" | "brand";
}) {
  const styles = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
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

export default function RidersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const load = useCallback(
    () =>
      fetchRidersPage({
        limit: PAGE_SIZE.grid,
        offset: (page - 1) * PAGE_SIZE.grid,
        search,
      }),
    [page, search]
  );

  const { data, loading, refreshing, error, refresh } = usePoll(load, 10000);
  const showSkeleton = loading && !data;

  const stats = data?.stats ?? { total: 0, onRoad: 0, activeDrops: 0, delivered: 0, available: 0 };
  const riders = data?.riders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE.grid));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE.grid + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE.grid, total);

  return (
    <div className="w-full space-y-5">
      <AdminScopeBanner variant="branch" />
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
              <Bike size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Riders</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Fleet overview — live assignments and delivery stats
              </p>
            </div>
          </div>
          <RefreshButton busy={loading || refreshing} onClick={refresh} />
        </div>
      </div>

      <p className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-900 dark:border-violet-800/50 dark:bg-violet-950/35 dark:text-violet-200">
        New rider accounts are created on{" "}
        <Link href="/admin/staff" className="font-semibold underline hover:text-violet-700">
          Staff → Add staff member (Rider role)
        </Link>
        . This page is for monitoring deliveries and assigning orders.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fleet size" value={stats.total} hint="Registered riders" icon={Users} accent="violet" />
        <KpiCard
          label="On delivery"
          value={stats.onRoad}
          hint={`${stats.activeDrops} active drop${stats.activeDrops === 1 ? "" : "s"}`}
          icon={Truck}
          accent="brand"
        />
        <KpiCard
          label="Available"
          value={stats.available}
          hint="Ready for assignment"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="Total delivered"
          value={stats.delivered}
          hint="All-time completions"
          icon={Package}
          accent="sky"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Search riders by name, email or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Assign riders from the <Link href="/admin/orders" className="font-semibold text-violet-700 hover:underline">Orders</Link> page when an order is ready to go out.
        </p>
      </div>

      {showSkeleton ? (
        <div className="grid w-full gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Bike size={36} className="mx-auto text-stone-300" />
          <p className="mt-3 font-medium text-stone-600">
            {search ? "No riders match your search" : "No riders yet"}
          </p>
          {!search && (
            <Link href="/admin/staff" className="btn-primary mt-4 inline-flex">
              Add rider via Staff
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid w-full gap-4">
            {riders.map((r) => {
              const busy = r.activeOrders.length > 0;
              return (
                <article
                  key={r.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                    busy ? "border-violet-200 ring-1 ring-violet-100" : "border-stone-200/80"
                  }`}
                >
                  <div className="flex items-center gap-4 border-b border-stone-100 p-4 sm:p-5">
                    <div
                      className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${avatarGradient(r.id)}`}
                    >
                      {initials(r.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-stone-900">{r.name}</h2>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            busy
                              ? "bg-violet-100 text-violet-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {busy ? "On delivery" : "Available"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-stone-500">{r.email}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                        <Phone size={12} /> {r.phone || "No phone"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{r.deliveredCount}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Delivered</p>
                      <p className="mt-1 text-xs text-stone-400">{r.totalAssigned} assigned</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      <Package size={12} /> Active deliveries ({r.activeOrders.length})
                    </p>

                    {r.activeOrders.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 py-8 text-center">
                        <Truck size={24} className="mx-auto text-stone-300" />
                        <p className="mt-2 text-sm text-stone-500">No active drops</p>
                        <p className="mt-0.5 text-xs text-stone-400">Assign from Orders when ready</p>
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {r.activeOrders.map((o) => (
                          <li
                            key={o.id}
                            className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3.5 dark:border-violet-800/50 dark:from-stone-800 dark:to-stone-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-stone-900">{o.orderNumber}</p>
                                  <FulfillmentBadge type={o.fulfillmentType} />
                                </div>
                                <p className="mt-0.5 text-xs text-stone-500">
                                  {formatWhen(o.createdAt)} · {pkr(o.total)}
                                </p>
                              </div>
                              <StatusBadge status={o.status} fulfillmentType={o.fulfillmentType} />
                            </div>
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-stone-600">
                              <MapPin size={12} className="mt-0.5 shrink-0 text-violet-500" />
                              {o.deliveryAddress}
                            </p>
                            <p className="mt-1.5 text-xs font-medium text-stone-700">
                              {o.customerName} · {o.customerPhone}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
