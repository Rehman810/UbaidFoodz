"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pkr } from "@/lib/format";
import { AdminCustomer } from "@/lib/admin-types";
import { fetchCustomersPage, type CustomerSort } from "@/lib/admin-customers";
import { usePoll } from "@/hooks/usePoll";
import { PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { CustomerTable } from "@/components/admin/CustomerTable";
import { BlockCustomerSheet } from "@/components/admin/BlockCustomerSheet";
import { CustomerHistorySheet } from "@/components/admin/CustomerHistorySheet";
import { ConfirmSheet } from "@/components/admin/ConfirmSheet";

type SortKey = CustomerSort;

type OrderBlock = {
  id: string;
  email: string | null;
  phone: string | null;
  reason: string;
  createdAt: string;
};

function phoneKey(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

function findContactBlock(blocks: OrderBlock[], email: string, phone: string | null) {
  const emailKey = email.trim().toLowerCase();
  const pKey = phoneKey(phone);
  return blocks.find(
    (b) => (b.email && b.email === emailKey) || (b.phone && pKey && b.phone === pKey)
  );
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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("spent");
  const [page, setPage] = useState(1);
  const [blocks, setBlocks] = useState<OrderBlock[]>([]);
  const [actionMsg, setActionMsg] = useState("");
  const [blockTarget, setBlockTarget] = useState<AdminCustomer | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<AdminCustomer | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AdminCustomer | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [blockError, setBlockError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const load = useCallback(
    () =>
      fetchCustomersPage({
        limit: PAGE_SIZE.table,
        offset: (page - 1) * PAGE_SIZE.table,
        search,
        sort,
      }),
    [page, search, sort]
  );

  const { data, loading, refreshing, error, refresh } = usePoll(load, 30000);
  const showSkeleton = loading && !data;

  const loadBlocks = useCallback(() => api<OrderBlock[]>("/admin/blocks"), []);

  useEffect(() => {
    if (!isAdmin) return;
    loadBlocks().then(setBlocks).catch(() => setBlocks([]));
  }, [loadBlocks, isAdmin]);

  function blockCustomer(c: AdminCustomer) {
    setBlockError("");
    setBlockTarget(c);
  }

  async function confirmBlock(reason: string) {
    if (!blockTarget) return;
    setBlocking(true);
    setBlockError("");
    setActionMsg("");
    try {
      await api("/admin/blocks", {
        method: "POST",
        body: JSON.stringify({ email: blockTarget.email, phone: blockTarget.phone, reason }),
      });
      setBlocks(await loadBlocks());
      setActionMsg(`${blockTarget.name} blocked from placing orders.`);
      setBlockTarget(null);
      refresh();
    } catch (err) {
      setBlockError(err instanceof Error ? err.message : "Could not block customer.");
    } finally {
      setBlocking(false);
    }
  }

  function unblockCustomer(c: AdminCustomer) {
    setUnblockTarget(c);
  }

  async function confirmUnblock() {
    if (!unblockTarget) return;
    const block = findContactBlock(blocks, unblockTarget.email, unblockTarget.phone ?? null);
    if (!block) return;
    setUnblocking(true);
    setActionMsg("");
    try {
      await api(`/admin/blocks/${block.id}`, { method: "DELETE" });
      setBlocks(await loadBlocks());
      setActionMsg(`${unblockTarget.name} can order again.`);
      setUnblockTarget(null);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Could not unblock customer.");
    } finally {
      setUnblocking(false);
    }
  }

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats ?? {
    count: 0,
    totalRevenue: 0,
    totalOrders: 0,
    avgSpend: 0,
    repeatRate: 0,
  };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE.table));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE.table + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE.table, total);

  const isCustomerBlocked = useCallback(
    (c: AdminCustomer) => Boolean(findContactBlock(blocks, c.email, c.phone ?? null)),
    [blocks]
  );

  return (
    <div className="w-full space-y-5">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">Customers</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Registered accounts and guest checkout — order history and lifetime value
              </p>
            </div>
          </div>
          <RefreshButton busy={loading || refreshing} onClick={refresh} />
        </div>
      </div>

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

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      {actionMsg && (
        <p className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
          {actionMsg}
        </p>
      )}

      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Search by name, email or phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
      </div>

      {showSkeleton ? (
        <div className="skeleton h-80 rounded-2xl" />
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <Users size={36} className="mx-auto text-stone-300" />
          <p className="mt-3 font-medium text-stone-600">
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            {search ? "Try a different name, email, or phone." : "Customers appear here after they place an order."}
          </p>
        </div>
      ) : (
        <>
          <CustomerTable
            customers={customers}
            topSpenderId={stats.topSpenderId}
            sortBySpent={sort === "spent"}
            isBlocked={isCustomerBlocked}
            isAdmin={isAdmin}
            onBlock={blockCustomer}
            onUnblock={unblockCustomer}
            onViewHistory={setHistoryTarget}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </>
      )}

      <BlockCustomerSheet
        customer={blockTarget}
        saving={blocking}
        error={blockError}
        onClose={() => {
          if (!blocking) setBlockTarget(null);
        }}
        onConfirm={confirmBlock}
      />

      <ConfirmSheet
        open={Boolean(unblockTarget)}
        title={`Unblock ${unblockTarget?.name ?? "customer"}?`}
        message="They will be able to place orders again immediately."
        confirmLabel="Unblock"
        saving={unblocking}
        onClose={() => {
          if (!unblocking) setUnblockTarget(null);
        }}
        onConfirm={confirmUnblock}
      />

      <CustomerHistorySheet customer={historyTarget} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}
