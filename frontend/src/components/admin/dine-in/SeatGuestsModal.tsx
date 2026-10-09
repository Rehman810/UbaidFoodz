"use client";

import { FormEvent, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import type { FloorTable, ReservationRow } from "@/modules/dine-in/api";
import { formatTimeShort, isToday, timingBadge } from "@/modules/dine-in/booking-ui";

export type SeatGuestsMode = "booking" | "walkin";

export function SeatGuestsModal({
  table,
  reservations,
  graceMin,
  nowMs,
  isManager,
  guestName,
  partySize,
  waiterId,
  waiters,
  seatMode,
  onSeatModeChange,
  selectedReservationId,
  onSelectReservation,
  walkInForce,
  onGuestName,
  onPartySize,
  onWaiterId,
  onWalkInForce,
  onClose,
  onSubmit,
}: {
  table: FloorTable;
  reservations: ReservationRow[];
  graceMin: number;
  nowMs: number;
  isManager: boolean;
  guestName: string;
  partySize: string;
  waiterId: string;
  waiters: { id: string; name: string }[];
  seatMode: SeatGuestsMode;
  onSeatModeChange: (mode: SeatGuestsMode) => void;
  selectedReservationId: string;
  onSelectReservation: (id: string) => void;
  walkInForce: boolean;
  onGuestName: (v: string) => void;
  onPartySize: (v: string) => void;
  onWaiterId: (v: string) => void;
  onWalkInForce: (v: boolean) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const tab = seatMode;
  const selectedId = selectedReservationId;

  const confirmedToday = useMemo(
    () => reservations.filter((r) => r.status === "CONFIRMED" && isToday(r.startsAt || r.reservedAt)),
    [reservations]
  );

  useEffect(() => {
    if (selectedId) {
      const b = confirmedToday.find((r) => r.id === selectedId);
      if (b) {
        onGuestName(b.guestName || b.customerName || "Guest");
        onPartySize(String(b.partySize));
      }
    }
  }, [selectedId, confirmedToday, onGuestName, onPartySize]);

  const selectedBooking = confirmedToday.find((r) => r.id === selectedId);
  const primaryLabel = selectedBooking
    ? `Seat ${(selectedBooking.guestName || selectedBooking.customerName || "guest").split(" ")[0]}'s party`
    : "Seat guests";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={onSubmit}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900"
      >
        <div className="flex items-start justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Seat guests at {table.label}</h2>
            <p className="text-sm text-stone-500">{table.zone || table.floor?.name} · {table.capacity} seats</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-stone-100 px-5 py-3 dark:border-stone-800">
          <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "booking" ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-50" : "text-stone-500"
              }`}
              onClick={() => onSeatModeChange("booking")}
            >
              From a booking
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "walkin" ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-50" : "text-stone-500"
              }`}
              onClick={() => {
                onSeatModeChange("walkin");
                onSelectReservation("");
              }}
            >
              Walk-in
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "booking" ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Confirmed bookings for today</p>
              <ul className="mt-3 space-y-2">
                {confirmedToday.length === 0 && (
                  <li className="rounded-xl border border-dashed border-stone-200 py-6 text-center text-sm text-stone-500">
                    No confirmed bookings today.
                  </li>
                )}
                {confirmedToday.map((r) => {
                  const over = r.partySize > table.capacity;
                  const bookedElsewhere = r.tableId && r.tableId !== table.id;
                  const badge = timingBadge(r.startsAt || r.reservedAt, graceMin, nowMs);
                  const selected = selectedId === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        disabled={over}
                        onClick={() => !over && onSelectReservation(r.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          over
                            ? "cursor-not-allowed border-stone-100 bg-stone-50 opacity-60"
                            : selected
                              ? "border-indigo-300 bg-indigo-50/80 ring-1 ring-indigo-200 dark:border-indigo-800 dark:bg-indigo-950/40"
                              : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                              selected ? "border-indigo-600 bg-indigo-600" : "border-stone-300"
                            }`}
                          >
                            {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-stone-900 dark:text-stone-50">
                                {r.guestName || r.customerName}, {r.partySize} guests
                              </p>
                              {!over && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    badge.tone === "late"
                                      ? "bg-amber-100 text-amber-900"
                                      : badge.tone === "due"
                                        ? "bg-indigo-100 text-indigo-900"
                                        : "bg-stone-100 text-stone-600"
                                  }`}
                                >
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-stone-500">
                              {formatTimeShort(r.startsAt || r.reservedAt)}
                              {r.table
                                ? bookedElsewhere
                                  ? `, booked for ${r.table.label}. Seating here moves the booking to ${table.label}.`
                                  : ", booked for this table"
                                : ", no seat assigned yet"}
                            </p>
                            {over && (
                              <p className="mt-1 text-xs text-stone-400">
                                Needs {r.partySize} seats and {table.label} has {table.capacity}.
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-stone-500">
              Walk-in guests are not linked to a booking.{" "}
              {table.nextReservation && !isManager
                ? "This table is booked soon — only a manager can seat a walk-in here."
                : table.nextReservation && isManager
                  ? "This table has a booking within the hour — confirm override below if needed."
                  : ""}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium text-stone-700 dark:text-stone-300">Guest name</span>
              <input
                className="input mt-1"
                value={guestName}
                onChange={(e) => onGuestName(e.target.value)}
                disabled={tab === "booking" && Boolean(selectedId)}
              />
            </label>
            <label className="text-sm">
              <span className="font-medium text-stone-700 dark:text-stone-300">Guests at the table</span>
              <input
                className="input mt-1"
                value={partySize}
                onChange={(e) => onPartySize(e.target.value)}
                disabled={tab === "booking" && Boolean(selectedId)}
              />
            </label>
          </div>
          {tab === "booking" && selectedId && (
            <p className="mt-2 text-xs text-stone-500">
              Name comes from the booking. Seating links the booking to this table.
            </p>
          )}
          <select className="input mt-3" value={waiterId} onChange={(e) => onWaiterId(e.target.value)}>
            <option value="">Assign waiter (optional)</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {tab === "walkin" && table.nextReservation && isManager && (
            <label className="mt-3 flex items-center gap-2 text-xs text-stone-600">
              <input type="checkbox" checked={walkInForce} onChange={(e) => onWalkInForce(e.target.checked)} />
              Override “reserved soon” for walk-in
            </label>
          )}
        </div>

        <div className="flex gap-2 border-t border-stone-100 px-5 py-4 dark:border-stone-800">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-[1.4] rounded-xl"
            disabled={tab === "booking" && !selectedId}
          >
            {tab === "booking" ? primaryLabel : "Seat walk-in"}
          </button>
        </div>
      </form>
    </div>
  );
}

