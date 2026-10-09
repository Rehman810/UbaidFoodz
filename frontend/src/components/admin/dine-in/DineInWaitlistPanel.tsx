"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, UserPlus, X } from "lucide-react";
import type { FloorTable, SeatType, WaitlistEntryRow } from "@/modules/dine-in/api";
import { seatTypeLabel } from "@/modules/dine-in/waitlist-ui";

const SEAT_OPTIONS: { value: SeatType | ""; label: string }[] = [
  { value: "", label: "Any seating" },
  { value: "TABLE", label: "Table" },
  { value: "TAKHT", label: "Takht" },
  { value: "BOOTH", label: "Booth" },
  { value: "HIGH_TOP", label: "High top" },
  { value: "OUTDOOR", label: "Outdoor" },
];

export function DineInWaitlistPanel({
  entries,
  tables,
  branchId,
  loading,
  onAdd,
  onCall,
  onCancel,
  onSeat,
}: {
  entries: WaitlistEntryRow[];
  tables: FloorTable[];
  branchId: string;
  loading: boolean;
  onAdd: (payload: {
    guestName: string;
    guestPhone?: string;
    partySize: number;
    preferredSeatType?: SeatType;
    preferredTableId?: string;
    notes?: string;
  }) => Promise<void>;
  onCall: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onSeat: (entry: WaitlistEntryRow, tableId: string) => Promise<void>;
}) {
  const active = entries.filter((e) => e.status === "WAITING" || e.status === "CALLED");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">Walk-in queue</h2>
            <p className="mt-1 text-sm text-stone-500">
              When the floor is full, add parties here. They get a <strong>queue number</strong> and an estimated wait. Seat them when a table or takht opens.
            </p>
          </div>
          {branchId && (
            <Link
              href={`/wait?branchId=${encodeURIComponent(branchId)}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold dark:border-stone-600"
            >
              Guest display <ExternalLink size={14} />
            </Link>
          )}
        </div>

        {active.length === 0 && !loading && (
          <p className="rounded-2xl border border-dashed border-stone-200 py-10 text-center text-sm text-stone-500">
            No one waiting. Use the form on the right when guests arrive and you have no free seats.
          </p>
        )}

        <ul className="space-y-2">
          {active.map((e) => (
            <li
              key={e.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-stone-900 ${
                e.status === "CALLED" ? "border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-800" : "border-stone-200 dark:border-stone-700"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-stone-900 text-lg font-bold text-white dark:bg-stone-100 dark:text-stone-900">
                    {e.queueNumber}
                  </span>
                  <div>
                    <p className="font-bold text-stone-900 dark:text-stone-50">{e.guestName}</p>
                    <p className="text-sm text-stone-600">{e.partySize} guests</p>
                    <p className="text-xs text-stone-500">
                      {e.preferredTable
                        ? `Prefers ${e.preferredTable.label} (${seatTypeLabel(e.preferredTable.seatType)})`
                        : seatTypeLabel(e.preferredSeatType)}
                      {e.guestPhone ? ` · ${e.guestPhone}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      ~{e.estimatedWaitMin} min wait · waiting {e.waitingMin} min
                      {e.status === "CALLED" ? " · Called" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.status === "WAITING" && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800"
                      onClick={() => void onCall(e.id)}
                    >
                      <Bell size={14} /> Call guest
                    </button>
                  )}
                  <SeatPicker entry={e} tables={tables} onSeat={(tableId) => void onSeat(e, tableId)} />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-red-600"
                    onClick={() => void onCancel(e.id)}
                  >
                    <X size={14} /> Left
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <AddWaitlistForm tables={tables} onAdd={onAdd} />
      </aside>
    </div>
  );
}

function SeatPicker({
  entry,
  tables,
  onSeat,
}: {
  entry: WaitlistEntryRow;
  tables: FloorTable[];
  onSeat: (tableId: string) => void;
}) {
  const fits = tables.filter(
    (t) =>
      t.capacity >= entry.partySize &&
      (t.displayStatus === "AVAILABLE" || t.status === "AVAILABLE") &&
      (!entry.preferredSeatType || t.seatType === entry.preferredSeatType)
  );

  return (
    <label className="text-xs font-medium text-stone-500">
      <span className="sr-only">Seat at</span>
      <select
        className="input min-w-[140px] text-sm"
        defaultValue=""
        onChange={(ev) => {
          const id = ev.target.value;
          if (id) onSeat(id);
          ev.target.value = "";
        }}
      >
        <option value="">Seat at…</option>
        {fits.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label} ({t.capacity}) · {seatTypeLabel(t.seatType)}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddWaitlistForm({
  tables,
  onAdd,
}: {
  tables: FloorTable[];
  onAdd: (payload: {
    guestName: string;
    guestPhone?: string;
    partySize: number;
    preferredSeatType?: SeatType;
    preferredTableId?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState("2");
  const [seatType, setSeatType] = useState<SeatType | "">("");
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const partyN = Number(party) || 2;
  const tableOptions = tables.filter((t) => t.capacity >= partyN);

  return (
    <form
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
          await onAdd({
            guestName: name.trim(),
            guestPhone: phone.trim() || undefined,
            partySize: partyN,
            preferredSeatType: seatType || undefined,
            preferredTableId: tableId || undefined,
            notes: notes.trim() || undefined,
          });
          setName("");
          setPhone("");
          setParty("2");
          setSeatType("");
          setTableId("");
          setNotes("");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h3 className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-50">
        <UserPlus size={18} /> Add to queue
      </h3>
      <p className="mt-1 text-xs text-stone-500">For walk-ins when there is no free table. They receive the next queue number for today.</p>
      <div className="mt-4 space-y-3">
        <input className="input" placeholder="Guest name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input" placeholder="Number of guests" value={party} onChange={(e) => setParty(e.target.value)} />
        <select className="input" value={seatType} onChange={(e) => setSeatType(e.target.value as SeatType | "")}>
          {SEAT_OPTIONS.map((o) => (
            <option key={o.value || "any"} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="input" value={tableId} onChange={(e) => setTableId(e.target.value)}>
          <option value="">Specific table/takht (optional)</option>
          {tableOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.zone} · {t.label} ({t.capacity} seats, {seatTypeLabel(t.seatType)})
            </option>
          ))}
        </select>
        <textarea className="input min-h-[64px]" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary mt-4 w-full" disabled={saving}>
        {saving ? "Adding…" : "Get queue number"}
      </button>
    </form>
  );
}
