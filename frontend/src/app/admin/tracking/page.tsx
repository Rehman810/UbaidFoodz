"use client";

import { useCallback, useMemo } from "react";
import { Map, RefreshCw, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { AdminStats } from "@/lib/admin-types";
import { Order, STATUS_LABEL } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { KanbanBoard, kanbanActiveCount } from "@/components/admin/KanbanBoard";
import { STATUS_THEME } from "@/lib/admin-status";

const KANBAN_STATUSES = [
  "AWAITING_CONFIRMATION",
  "PENDING",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export default function TrackingPage() {
  const load = useCallback(async () => {
    const orders = await api<Order[]>("/orders");
    let riders: AdminStats["riders"] = [];
    try {
      const stats = await api<AdminStats>("/admin/stats");
      riders = stats.riders;
    } catch {
      /* riders optional for board display */
    }
    return { orders, riders };
  }, []);

  const { data, loading, error, refresh } = usePoll(load, 8000);

  const stats = useMemo(() => {
    const list = data?.orders || [];
    const active = kanbanActiveCount(list);
    const delivered = list.filter((o) => o.status === "DELIVERED").length;
    const pipelineValue = list
      .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + Number(o.total), 0);
    return { active, delivered, pipelineValue, total: list.length };
  }, [data]);

  return (
    <div className="flex h-[calc(100dvh-7.25rem)] flex-col gap-3 overflow-hidden">
      {/* Header card */}
      <div className="shrink-0 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Map size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Live tracking</h1>
              <p className="mt-0.5 text-sm text-stone-500">
                Drag orders forward · auto-refresh every 8s
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            {[
              { label: "In pipeline", value: stats.active, accent: "text-amber-600 bg-amber-50 ring-amber-100" },
              { label: "Delivered", value: stats.delivered, accent: "text-emerald-600 bg-emerald-50 ring-emerald-100" },
              { label: "Pipeline value", value: pkr(stats.pipelineValue), accent: "text-brand-700 bg-brand-50 ring-brand-100" },
              { label: "Total orders", value: stats.total, accent: "text-stone-700 bg-stone-50 ring-stone-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl px-3 py-2 ring-1 ${s.accent}`}>
                <p className="text-[11px] font-medium text-stone-500">{s.label}</p>
                <p className="mt-0.5 text-lg font-semibold leading-none">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
              <Timer size={13} className="text-emerald-500" />
              Live
            </span>
            {KANBAN_STATUSES.map((status) => {
              const theme = STATUS_THEME[status];
              const count = data?.orders.filter((o) => o.status === status).length ?? 0;
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${theme.bg} ${theme.text} ${theme.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                  {STATUS_LABEL[status]}
                  <span className="font-semibold">{count}</span>
                </span>
              );
            })}
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Kanban — fills remaining height, columns scroll internally */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {loading && (
          <div className="flex h-full gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton min-h-[200px] flex-1 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && data && (
          <KanbanBoard orders={data.orders} onRefresh={refresh} className="h-full" />
        )}
      </div>
    </div>
  );
}
