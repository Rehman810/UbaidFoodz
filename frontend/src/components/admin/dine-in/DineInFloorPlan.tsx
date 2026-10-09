"use client";

import Link from "next/link";
import {
  Brush,
  Calendar,
  CircleDot,
  Layers,
  Plus,
  Receipt,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { pkr } from "@/lib/format";
import type { DiningFloorRow, FloorTable, SeatType } from "@/modules/dine-in/api";
import { formatSeatedDuration, formatTimeShort, graceEndIso, timingBadge } from "@/modules/dine-in/booking-ui";

const SEAT_TYPE_META: Record<
  SeatType,
  { label: string; shape: string; icon?: "sun" }
> = {
  TABLE: { label: "Table", shape: "rounded-full aspect-square" },
  TAKHT: { label: "Takht", shape: "rounded-2xl aspect-[4/3] min-w-[140px]" },
  BOOTH: { label: "Booth", shape: "rounded-xl aspect-square" },
  HIGH_TOP: { label: "High top", shape: "rounded-full aspect-[3/4] min-h-[140px]" },
  OUTDOOR: { label: "Outdoor", shape: "rounded-full aspect-square", icon: "sun" },
};

type FloorGroup = {
  id: string;
  name: string;
  sortOrder: number;
  tables: FloorTable[];
};

function buildFloorGroups(floors: DiningFloorRow[], tables: FloorTable[]): FloorGroup[] {
  const byFloor = new Map<string, FloorTable[]>();
  for (const t of tables) {
    const fid = t.floorId ?? t.floor?.id ?? `zone:${t.zone}`;
    const list = byFloor.get(fid) ?? [];
    list.push(t);
    byFloor.set(fid, list);
  }

  const groups: FloorGroup[] = floors.map((f) => ({
    id: f.id,
    name: f.name,
    sortOrder: f.sortOrder,
    tables: byFloor.get(f.id) ?? [],
  }));

  for (const [key, zoneTables] of byFloor) {
    if (floors.some((f) => f.id === key)) continue;
    const name = zoneTables[0]?.zone?.trim() || "Main floor";
    groups.push({ id: key, name, sortOrder: 999, tables: zoneTables });
  }

  return groups.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

function floorStats(tables: FloorTable[]) {
  return {
    free: tables.filter((t) => t.status === "AVAILABLE").length,
    seated: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    cleaning: tables.filter((t) => t.status === "NEEDS_CLEANING").length,
  };
}

function tableStatusLine(t: FloorTable, nowMs: number) {
  if (t.status === "OCCUPIED" && t.activeSession) {
    return `Seated ${formatSeatedDuration(t.activeSession.openedAt, nowMs)}`;
  }
  if (t.status === "RESERVED" && t.nextReservation) {
    return `Booked ${formatTimeShort(t.nextReservation.startsAt || t.nextReservation.reservedAt)}`;
  }
  if (t.status === "NEEDS_CLEANING") return "Cleaning";
  return "Free";
}

function pillClasses(status: FloorTable["status"]) {
  if (status === "AVAILABLE") {
    return "bg-white text-stone-900 ring-2 ring-emerald-500 shadow-md dark:bg-stone-900 dark:text-stone-50";
  }
  if (status === "OCCUPIED") {
    return "bg-orange-400 text-stone-900 shadow-md ring-2 ring-orange-500/40";
  }
  if (status === "RESERVED") {
    return "bg-indigo-900 text-white shadow-md ring-2 ring-indigo-700";
  }
  return "dine-table-cleaning bg-stone-300 text-stone-800 shadow-md ring-2 ring-stone-400/50";
}

export function DineInFloorPlan({
  floors,
  tables,
  unassignedReservations,
  waiters,
  loading,
  selectedId,
  graceMin,
  nowMs,
  onSelect,
  onAddFloor,
  onAddTable,
  onSeat,
  onSeatWalkIn,
  onSeatBooking,
  onCloseSession,
  onMarkClean,
  onDeleteTable,
  pendingBookingsCount = 0,
  onReviewBookings,
}: {
  floors: DiningFloorRow[];
  tables: FloorTable[];
  unassignedReservations: { id: string; reservedAt: string; startsAt?: string; partySize: number; customerName: string }[];
  waiters: { id: string; name: string }[];
  loading: boolean;
  selectedId: string | null;
  graceMin: number;
  nowMs: number;
  onSelect: (id: string | null) => void;
  onAddFloor: () => void;
  onAddTable: () => void;
  onSeat: (table: FloorTable) => void;
  onSeatWalkIn: (table: FloorTable) => void;
  onSeatBooking: (reservationId: string) => void;
  onCloseSession: (sessionId: string, label: string) => void;
  onMarkClean: (tableId: string) => void;
  onDeleteTable: (table: FloorTable) => void;
  pendingBookingsCount?: number;
  onReviewBookings?: () => void;
}) {
  const floorGroups = buildFloorGroups(floors, tables);
  const selected = tables.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,320px)]">
      <div className="space-y-4">
        {pendingBookingsCount > 0 && onReviewBookings && (
          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-sm text-indigo-950 dark:text-indigo-100">
              <strong>{pendingBookingsCount}</strong> booking{pendingBookingsCount === 1 ? "" : "s"} are waiting for your confirmation. Guests are not promised a seat until you confirm.
            </p>
            <button type="button" onClick={onReviewBookings} className="shrink-0 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white">
              Review bookings
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full ring-2 ring-emerald-500 bg-white" /> Free
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-400" /> Seated
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-900" /> Booked
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full dine-table-cleaning bg-stone-300 ring-1 ring-stone-400" /> Cleaning
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onAddFloor} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900">
              <Layers size={16} className="inline mr-1" /> Add floor
            </button>
            <button type="button" onClick={onAddTable} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900" disabled={floors.length === 0}>
              <Plus size={16} className="inline mr-1" /> Add seat
            </button>
          </div>
        </div>

        {floors.length === 0 && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            Start by adding a <strong>floor</strong> (e.g. Ground, Terrace, Family hall). Then add tables or takhts on that floor.
          </div>
        )}

        {unassignedReservations.length > 0 && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-800 dark:bg-violet-950/30">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Bookings without a seat yet
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-violet-900 dark:text-violet-100">
              {unassignedReservations.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <Calendar size={14} />
                    <span className="font-semibold">{r.customerName}</span>
                    <span className="text-violet-700/80 dark:text-violet-300/80">
                      {new Date(r.startsAt || r.reservedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })} · {r.partySize} guests
                    </span>
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-violet-700 px-2.5 py-1 text-[11px] font-bold text-white"
                    onClick={() => onSeatBooking(r.id)}
                  >
                    Seat now
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className="relative min-h-[420px] overflow-hidden rounded-3xl border border-stone-300/80 bg-[#e8e4dc] shadow-inner dark:border-stone-600 dark:bg-[#1c1917]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,113,108,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-stone-900/5 dark:from-white/5 dark:to-black/20" />

          {loading ? (
            <div className="grid h-[420px] place-items-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-stone-300/50" />
            </div>
          ) : tables.length === 0 && floors.length === 0 ? (
            <div className="flex h-[420px] flex-col items-center justify-center p-6 text-center">
              <Sparkles className="text-stone-400" size={36} />
              <p className="mt-3 font-semibold text-stone-700 dark:text-stone-200">No seats on the map yet</p>
              <p className="mt-1 max-w-sm text-sm text-stone-500">
                Create floors (Indoor, Terrace, Takht hall), then place tables, booths, or takhts so staff can see what is vacant or reserved.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button type="button" className="btn-ghost" onClick={onAddFloor}>
                  <Layers size={16} /> Add floor
                </button>
                {floors.length > 0 && (
                  <button type="button" className="btn-primary" onClick={onAddTable}>
                    <Plus size={16} /> Add seat
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative space-y-10 p-6 sm:p-8">
              {floorGroups.map((group, zi) => {
                const stats = floorStats(group.tables);
                const isEmptyFloor = group.tables.length === 0;
                return (
                  <section key={group.id}>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 shadow-sm dark:bg-stone-900/90 dark:text-stone-200">
                        <CircleDot size={12} /> {group.name}
                      </p>
                      {isEmptyFloor ? (
                        <span className="text-[11px] font-medium text-stone-500">No seats yet</span>
                      ) : (
                        <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                          {stats.free} free · {stats.seated} seated · {stats.reserved} booked
                          {stats.cleaning ? ` · ${stats.cleaning} cleaning` : ""}
                        </span>
                      )}
                      {isEmptyFloor && (
                        <button type="button" className="text-[11px] font-bold text-brand-600" onClick={onAddTable}>
                          + Add seat here
                        </button>
                      )}
                    </div>
                    {isEmptyFloor ? (
                      <div className="rounded-2xl border border-dashed border-stone-300/80 bg-white/40 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-600 dark:bg-stone-900/30">
                        Empty floor — add tables or takhts to build this section.
                      </div>
                    ) : (
                    <div className="flex flex-wrap justify-center gap-6 sm:justify-start sm:gap-8">
                      {group.tables.map((t, i) => {
                        const seatMeta = SEAT_TYPE_META[t.seatType ?? "TABLE"];
                        const isSelected = selectedId === t.id;
                        const occupied = t.status === "OCCUPIED" && t.activeSession;
                        const statusLine = tableStatusLine(t, nowMs);
                        const sizeClass =
                          t.seatType === "TAKHT"
                            ? "h-[108px] w-[168px] sm:h-[116px] sm:w-[180px]"
                            : t.seatType === "HIGH_TOP"
                              ? "h-[132px] w-[96px]"
                              : "h-[112px] w-[112px] sm:h-[120px] sm:w-[120px]";
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => onSelect(t.id)}
                            className={`dine-table-pop group relative flex flex-col items-center justify-center ${pillClasses(t.status)} ${seatMeta.shape} ${sizeClass} transition duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                              isSelected ? "ring-4 ring-stone-900 scale-[1.02] dark:ring-stone-100" : ""
                            } ${occupied ? "dine-table-occupied" : ""}`}
                            style={{ animationDelay: `${zi * 80 + i * 60}ms` }}
                          >
                            {seatMeta.icon === "sun" && (
                              <Sun className="absolute right-2 top-2 z-10 h-4 w-4 text-amber-600/70" />
                            )}
                            <span className="relative z-10 text-base font-bold leading-tight sm:text-lg">
                              {t.label}
                            </span>
                            <span className="relative z-10 mt-1 text-[11px] font-medium opacity-90">{statusLine}</span>
                            <span className="relative z-10 mt-1 flex items-center gap-1 text-[10px] font-semibold opacity-80">
                              <Users size={11} /> {t.capacity} seats
                            </span>
                            {occupied && (
                              <span className="absolute -bottom-2 z-20 rounded-full bg-stone-900 px-2 py-0.5 text-[9px] font-bold text-white shadow dark:bg-stone-100 dark:text-stone-900">
                                {pkr(t.activeSession!.runningTotal)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          {!selected ? (
            <div className="py-10 text-center text-sm text-stone-500">
              <CircleDot className="mx-auto mb-2 text-stone-300" size={32} />
              Tap a table to seat guests or open its booking.
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-50">{selected.label}</h3>
                  <p className="text-sm text-stone-500">
                    {selected.zone || selected.floor?.name || "Main floor"}, {selected.capacity} seats
                  </p>
                </div>
                <button type="button" onClick={() => onSelect(null)} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
                  <X size={18} />
                </button>
              </div>

              {selected.activeSession ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                  <p className="font-semibold text-stone-900 dark:text-stone-50">{selected.activeSession.guestName}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300">
                    {selected.activeSession.partySize} guests
                    {selected.activeSession.waiter ? ` · ${selected.activeSession.waiter.name}` : ""}
                  </p>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {selected.activeSession.orderCount} tickets · {pkr(selected.activeSession.runningTotal)}
                  </p>
                  <Link
                    href={`/admin/pos?session=${selected.activeSession.id}&table=${selected.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    <Receipt size={16} /> Open POS
                  </Link>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-stone-200 py-2 text-sm font-semibold dark:border-stone-600"
                    onClick={() => onCloseSession(selected.activeSession!.id, selected.label)}
                  >
                    Close table
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {selected.nextReservation && selected.status === "RESERVED" && (() => {
                    const starts = selected.nextReservation.startsAt || selected.nextReservation.reservedAt;
                    const badge = timingBadge(starts, graceMin, nowMs);
                    const guest = selected.nextReservation.customerName;
                    const first = guest.split(" ")[0] || "guest";
                    return (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
                        <p className="font-bold">Booked for {formatTimeShort(starts)}</p>
                        <p className="mt-1 font-semibold">{guest}, {selected.nextReservation.partySize} guests</p>
                        <p className="mt-2 text-xs text-indigo-800/80 dark:text-indigo-200/80">
                          {badge.label}. The seat is held until {formatTimeShort(graceEndIso(starts, graceMin))}, then the booking is released.
                        </p>
                        <button
                          type="button"
                          onClick={() => onSeat(selected)}
                          className="mt-4 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900"
                        >
                          Seat {first}&apos;s party
                        </button>
                        <button
                          type="button"
                          onClick={() => onSeatWalkIn(selected)}
                          className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900"
                        >
                          Seat a walk-in instead
                        </button>
                        <p className="mt-2 text-[11px] text-stone-500">
                          This table is booked within the hour, so only a manager can seat a walk-in here.
                        </p>
                      </div>
                    );
                  })()}
                  {selected.status === "AVAILABLE" && !selected.nextReservation && (
                    <button
                      type="button"
                      onClick={() => onSeat(selected)}
                      className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900"
                    >
                      Seat guests
                    </button>
                  )}
                  {selected.status === "NEEDS_CLEANING" && (
                    <button
                      type="button"
                      onClick={() => onMarkClean(selected.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-900"
                    >
                      <Brush size={16} /> Mark seat clean
                    </button>
                  )}
                </div>
              )}

              {!selected.activeSession && (
                <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
                  <p className="text-xs font-medium text-stone-500">Waiter</p>
                  <button type="button" className="mt-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold dark:border-stone-600" disabled>
                    Assign waiter
                  </button>
                </div>
              )}

              <button
                type="button"
                className="mt-6 text-sm font-semibold text-red-600 hover:underline"
                onClick={() => onDeleteTable(selected)}
              >
                Remove seat from floor
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
