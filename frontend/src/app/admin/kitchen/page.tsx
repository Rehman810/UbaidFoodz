"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellOff, ChefHat, RefreshCw, Timer, Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import { usePoll } from "@/hooks/usePoll";
import { STATUS_THEME } from "@/lib/admin-status";
import { KitchenTicket } from "@/components/admin/KitchenTicket";

type Lane = "PENDING" | "PREPARING" | "OUT_FOR_DELIVERY";
type TypeFilter = "ALL" | "DELIVERY" | "PICKUP";

const LANES: { status: Lane; title: string; hint: string }[] = [
  { status: "PENDING", title: "New", hint: "Start cooking" },
  { status: "PREPARING", title: "Cooking", hint: "Mark ready" },
  { status: "OUT_FOR_DELIVERY", title: "Ready", hint: "Counter & riders" },
];

function playChime() {
  const AudioCtx =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  [880, 1174].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02 + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + i * 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + 0.35 + i * 0.1);
  });
}

export default function KitchenPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [soundOn, setSoundOn] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const seenRef = useRef<Set<string> | null>(null);

  const load = useCallback(() => api<Order[]>("/orders"), []);
  const { data, loading, error, refresh } = usePoll(load, 5000);

  const kitchenOrders = useMemo(() => {
    const list = (data || []).filter(
      (o) => o.status === "PENDING" || o.status === "PREPARING" || o.status === "OUT_FOR_DELIVERY"
    );
    if (typeFilter === "ALL") return list;
    return list.filter((o) => (o.fulfillmentType || "DELIVERY") === typeFilter);
  }, [data, typeFilter]);

  useEffect(() => {
    const newIds = kitchenOrders.filter((o) => o.status === "PENDING").map((o) => o.id);
    if (!seenRef.current) {
      seenRef.current = new Set(newIds);
      return;
    }
    const fresh = newIds.filter((id) => !seenRef.current!.has(id));
    if (fresh.length && soundOn) playChime();
    seenRef.current = new Set(newIds.concat(kitchenOrders.map((o) => o.id)));
  }, [kitchenOrders, soundOn]);

  async function bump(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
    try {
      await api(`/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [order.id]: e instanceof Error ? e.message : "Could not update ticket",
      }));
    } finally {
      setBusyId(null);
    }
  }

  function actionFor(order: Order) {
    if (order.status === "PENDING") {
      return { label: "Start cooking", run: () => bump(order, "PREPARING") };
    }
    if (order.status === "PREPARING") {
      return {
        label: order.fulfillmentType === "PICKUP" ? "Ready for pickup" : "Ready — send out",
        run: () => bump(order, "OUT_FOR_DELIVERY"),
      };
    }
    if (order.status === "OUT_FOR_DELIVERY" && order.fulfillmentType === "PICKUP") {
      return { label: "Collected", run: () => bump(order, "DELIVERED") };
    }
    return null;
  }

  const counts = {
    PENDING: kitchenOrders.filter((o) => o.status === "PENDING").length,
    PREPARING: kitchenOrders.filter((o) => o.status === "PREPARING").length,
    READY: kitchenOrders.filter((o) => o.status === "OUT_FOR_DELIVERY").length,
  };

  return (
    <div className="flex h-[calc(100dvh-7.25rem)] flex-col gap-3 overflow-hidden">
      <div className="shrink-0 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Kitchen</h1>
              <p className="mt-0.5 text-sm text-stone-500">Tickets for the pass · auto-refresh every 5s</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {[
              { label: "New", value: counts.PENDING, accent: "text-amber-700 bg-amber-50 ring-amber-100" },
              { label: "Cooking", value: counts.PREPARING, accent: "text-blue-700 bg-blue-50 ring-blue-100" },
              { label: "Ready", value: counts.READY, accent: "text-violet-700 bg-violet-50 ring-violet-100" },
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
            {LANES.map((lane) => {
              const theme = STATUS_THEME[lane.status];
              const count = kitchenOrders.filter((o) => o.status === lane.status).length;
              return (
                <span
                  key={lane.status}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${theme.bg} ${theme.text} ${theme.ring}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                  {lane.title}
                  <span className="font-semibold">{count}</span>
                </span>
              );
            })}
            <div className="ml-1 inline-flex rounded-lg bg-stone-100 p-0.5">
              {(
                [
                  ["ALL", "All"],
                  ["DELIVERY", "Delivery"],
                  ["PICKUP", "Takeaway"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTypeFilter(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    typeFilter === id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundOn((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ${
                soundOn
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-white text-stone-600 ring-stone-200"
              }`}
            >
              {soundOn ? <Volume2 size={14} /> : <BellOff size={14} />}
              {soundOn ? "Alerts on" : "Alerts off"}
            </button>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
        {LANES.map((lane) => {
          const theme = STATUS_THEME[lane.status];
          const list = kitchenOrders.filter((o) => o.status === lane.status);
          return (
            <div key={lane.status} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className={`shrink-0 rounded-t-2xl border border-b-0 px-4 py-3 ${theme.border} ${theme.bg}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.dot}`} />
                    <h2 className="truncate text-sm font-semibold text-stone-800">{lane.title}</h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${theme.bg} ${theme.text} ${theme.ring}`}
                  >
                    {list.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{lane.hint}</p>
              </div>

              <div className="kanban-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-b-2xl border border-t-0 border-stone-200/80 bg-white p-2 shadow-inner">
                {loading && !data && (
                  <>
                    <div className="skeleton h-32 rounded-xl" />
                    <div className="skeleton h-28 rounded-xl" />
                  </>
                )}
                {!loading && list.length === 0 && (
                  <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center">
                    <div className={`mb-3 grid h-10 w-10 place-items-center rounded-full ${theme.bg}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
                    </div>
                    <p className="text-sm font-medium text-stone-500">No tickets</p>
                    <p className="mt-1 text-xs text-stone-400">{lane.hint}</p>
                  </div>
                )}
                {list.map((order) => {
                  const action = actionFor(order);
                  return (
                    <KitchenTicket
                      key={order.id}
                      order={order}
                      actionLabel={action?.label}
                      onAction={action?.run}
                      busy={busyId === order.id}
                      error={errors[order.id]}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
