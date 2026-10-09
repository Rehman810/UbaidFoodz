"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBranch } from "@/modules/branches/BranchContext";
import { AdminScopeBanner } from "@/components/admin/AdminScopeBanner";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { ConfirmSheet } from "@/components/admin/ConfirmSheet";
import { DineInBookingsPanel } from "@/components/admin/dine-in/DineInBookingsPanel";
import { DineInFloorPlan } from "@/components/admin/dine-in/DineInFloorPlan";
import { DineInWaitlistPanel } from "@/components/admin/dine-in/DineInWaitlistPanel";
import { SeatGuestsModal, type SeatGuestsMode } from "@/components/admin/dine-in/SeatGuestsModal";
import { secondsAgoLabel } from "@/modules/dine-in/booking-ui";
import {
  closeTableSession,
  confirmReservation,
  createFloor,
  createReservation,
  createTable,
  deleteTable,
  fetchFloor,
  fetchReservations,
  markNoShow,
  markTableClean,
  openTableSession,
  patchReservation,
  rejectReservation,
  seatReservation,
  addToWaitlist,
  fetchWaitlist,
  patchWaitlistEntry,
  seatFromWaitlist,
  type DiningFloorRow,
  type FloorTable,
  type ReservationRow,
  type SeatType,
  type WaitlistEntryRow,
} from "@/modules/dine-in/api";

type Tab = "floor" | "reservations" | "waitlist";

export default function DineInPage() {
  const { user } = useAuth();
  const { selection, activeBranch } = useBranch();
  const isManager = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [tab, setTab] = useState<Tab>("floor");
  const [floors, setFloors] = useState<DiningFloorRow[]>([]);
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [unassignedReservations, setUnassignedReservations] = useState<
    { id: string; reservedAt: string; startsAt: string; partySize: number; customerName: string; guestName: string }[]
  >([]);
  const [waiters, setWaiters] = useState<{ id: string; name: string }[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const [floorFormOpen, setFloorFormOpen] = useState(false);
  const [floorName, setFloorName] = useState("");

  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [tableLabel, setTableLabel] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [tableFloorId, setTableFloorId] = useState("");
  const [tableSeatType, setTableSeatType] = useState<SeatType>("TABLE");

  const [seatTarget, setSeatTarget] = useState<FloorTable | null>(null);
  const [guestName, setGuestName] = useState("Walk-in");
  const [partySize, setPartySize] = useState("2");
  const [waiterId, setWaiterId] = useState("");
  const [seatReservationId, setSeatReservationId] = useState("");
  const [seatMode, setSeatMode] = useState<SeatGuestsMode>("walkin");
  const [seatForce, setSeatForce] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [waitlistWaitingCount, setWaitlistWaitingCount] = useState(0);
  const [waitlist, setWaitlist] = useState<WaitlistEntryRow[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());
  const [historyView, setHistoryView] = useState(false);
  const [graceMin, setGraceMin] = useState(15);

  const [resFormOpen, setResFormOpen] = useState(false);
  const [resName, setResName] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resParty, setResParty] = useState("2");
  const [resWhen, setResWhen] = useState("");
  const [resTableId, setResTableId] = useState("");
  const [resNotes, setResNotes] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<FloorTable | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [closeTarget, setCloseTarget] = useState<{ sessionId: string; label: string } | null>(null);
  const [closeForce, setCloseForce] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [closing, setClosing] = useState(false);

  const [pickTableBooking, setPickTableBooking] = useState<{ id: string; guestName: string; partySize: number } | null>(null);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const branchRequired = selection === "all";

  const loadFloor = useCallback(async () => {
    if (branchRequired) return;
    const data = await fetchFloor();
    setFloors(data.floors);
    setTables(data.tables);
    setUnassignedReservations(data.unassignedReservations);
    setWaiters(data.waiters);
    setGraceMin(data.graceMin ?? 15);
    setPendingBookingsCount(data.pendingBookingsCount ?? 0);
    setWaitlistWaitingCount(data.waitlistWaitingCount ?? 0);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dine-in-pending", { detail: data.pendingBookingsCount ?? 0 }));
    }
    setTableFloorId((prev) => prev || data.floors[0]?.id || "");
  }, [branchRequired]);

  const loadWaitlist = useCallback(async () => {
    if (branchRequired) {
      setWaitlist([]);
      return;
    }
    const data = await fetchWaitlist();
    setWaitlist(data.entries);
    setWaitlistWaitingCount(data.waitingCount);
  }, [branchRequired]);

  const loadReservations = useCallback(async () => {
    if (branchRequired) {
      setReservations([]);
      return;
    }
    const data = await fetchReservations(historyView);
    setReservations(data.reservations);
  }, [branchRequired, historyView]);

  const load = useCallback(
    async (manual = false) => {
      if (branchRequired) {
        setLoading(false);
        return;
      }
      if (manual) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        await Promise.all([loadFloor(), loadReservations(), loadWaitlist()]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not load dine-in data";
        setError(message);
        if (message.toLowerCase().includes("branch")) setReservations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLastRefreshedAt(Date.now());
      }
    },
    [branchRequired, loadFloor, loadReservations, loadWaitlist]
  );

  useEffect(() => {
    void load();
  }, [load, selection, historyView]);

  useEffect(() => {
    if (branchRequired || (tab !== "floor" && tab !== "waitlist")) return;
    const tick = () => {
      if (document.hidden) return;
      void load(true);
    };
    const id = window.setInterval(tick, 12_000);
    return () => window.clearInterval(id);
  }, [branchRequired, tab, load]);

  async function addFloor(e: FormEvent) {
    e.preventDefault();
    if (!floorName.trim()) return;
    try {
      const { floor } = await createFloor({ name: floorName.trim() });
      setFloors((prev) => [...prev, floor].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setTableFloorId(floor.id);
      setFloorFormOpen(false);
      setFloorName("");
      setMsg(`Floor “${floor.name}” created — add tables or takhts on it.`);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create floor");
    }
  }

  async function addTable(e: FormEvent) {
    e.preventDefault();
    if (!tableLabel.trim() || !tableFloorId) return;
    try {
      await createTable({
        label: tableLabel.trim(),
        capacity: Number(tableCapacity) || 4,
        floorId: tableFloorId,
        seatType: tableSeatType,
      });
      setTableFormOpen(false);
      setTableLabel("");
      setMsg("Seat added to the floor map.");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add seat");
    }
  }

  function openSeatModal(table: FloorTable, mode: SeatGuestsMode, reservationId?: string) {
    setSeatTarget(table);
    setSeatMode(mode);
    const rid = mode === "booking" ? reservationId || table.nextReservation?.id || seatReservationId : "";
    setSeatReservationId(rid || "");
    const booking = rid
      ? reservations.find((x) => x.id === rid) ??
        unassignedReservations.find((x) => x.id === rid)
      : undefined;
    setGuestName(
      booking?.guestName || booking?.customerName || table.nextReservation?.customerName || "Walk-in"
    );
    setPartySize(String(booking?.partySize || table.nextReservation?.partySize || 2));
    setSeatForce(false);
    setWaiterId("");
  }

  async function handleOpenSession(e: FormEvent) {
    e.preventDefault();
    if (!seatTarget) return;
    try {
      const rid = seatMode === "booking" ? seatReservationId || seatTarget.nextReservation?.id : "";
      if (rid) {
        await seatReservation(rid, {
          tableId: seatTarget.id,
          guestName,
          partySize: Number(partySize) || 2,
          waiterId: waiterId || undefined,
        });
      } else {
        await openTableSession(seatTarget.id, {
          guestName,
          partySize: Number(partySize) || 2,
          waiterId: waiterId || undefined,
          force: seatForce && isManager,
        });
      }
      setSeatTarget(null);
      setSelectedTableId(seatTarget.id);
      setMsg(`Table ${seatTarget.label} is seated — open POS to add items.`);
      await load(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open table";
      setError(message);
      if (message.toLowerCase().includes("taken") || message.includes("409")) void load(true);
    }
  }

  return (
    <div className="w-full space-y-5">
      <AdminScopeBanner variant="branch" />

      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50 sm:text-3xl">Dine-in floor</h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {activeBranch?.name ?? "Select a branch"} branch. Tap a table to seat guests or open its booking.
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Guests keep their seat for {graceMin} minutes after the booking time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500">Updated {secondsAgoLabel(lastRefreshedAt, clock)}</span>
            <RefreshButton busy={loading || refreshing} onClick={() => load(true)} />
            {isManager && (
              <>
                <button type="button" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900" onClick={() => setFloorFormOpen(true)}>
                  <Layers size={16} className="inline mr-1" /> Add floor
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold dark:border-stone-600 dark:bg-stone-900"
                  onClick={() => {
                    if (floors[0] && !tableFloorId) setTableFloorId(floors[0].id);
                    setTableFormOpen(true);
                  }}
                >
                  <Plus size={16} className="inline mr-1" /> Add seat
                </button>
              </>
            )}
            <Link href="/book" target="_blank" className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold dark:border-stone-600">
              Guest booking ↗
            </Link>
          </div>
        </div>

        <div className="flex gap-2">
          {(["floor", "reservations", "waitlist"] as Tab[]).map((t) => {
            const pending = pendingBookingsCount || reservations.filter((r) => r.status === "PENDING").length;
            const label = t === "floor" ? "Live floor" : t === "reservations" ? "Bookings" : "Walk-in queue";
            const badge =
              t === "reservations" ? pending : t === "waitlist" ? waitlistWaitingCount : 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {branchRequired && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40">
          Choose <strong>one branch</strong> in the header (not “All branches”) to see the floor plan.
        </p>
      )}

      {msg && (
        <p className="animate-fade-up rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {msg}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40">
          {error}
        </p>
      )}

      {!branchRequired && tab === "floor" && (
        <DineInFloorPlan
          floors={floors}
          tables={tables}
          unassignedReservations={unassignedReservations}
          waiters={waiters}
          loading={loading}
          selectedId={selectedTableId}
          onSelect={setSelectedTableId}
          onAddFloor={() => setFloorFormOpen(true)}
          onAddTable={() => {
            if (floors[0] && !tableFloorId) setTableFloorId(floors[0].id);
            setTableFormOpen(true);
          }}
          pendingBookingsCount={pendingBookingsCount}
          onReviewBookings={() => setTab("reservations")}
          onSeat={(t) => openSeatModal(t, t.nextReservation ? "booking" : "walkin")}
          onSeatWalkIn={(t) => openSeatModal(t, "walkin")}
          graceMin={graceMin}
          nowMs={clock}
          onSeatBooking={(bookingId) => {
            const b = unassignedReservations.find((x) => x.id === bookingId);
            if (!b) return;
            setPickTableBooking({
              id: b.id,
              guestName: b.guestName || b.customerName,
              partySize: b.partySize,
            });
          }}
          onCloseSession={(sessionId, label) => setCloseTarget({ sessionId, label })}
          onMarkClean={async (id) => {
            await markTableClean(id);
            setMsg("Table is ready for the next guests.");
            await load(true);
          }}
          onDeleteTable={(t) => setDeleteTarget(t)}
        />
      )}

      {!branchRequired && tab === "waitlist" && (
        <DineInWaitlistPanel
          entries={waitlist}
          tables={tables}
          branchId={activeBranch?.id ?? ""}
          loading={loading}
          onAdd={async (payload) => {
            const { entry, message } = await addToWaitlist(payload);
            setMsg(message || `Queue #${entry.queueNumber} — tell the guest ~${entry.estimatedWaitMin} min wait.`);
            await load(true);
          }}
          onCall={async (id) => {
            await patchWaitlistEntry(id, { status: "CALLED" });
            await load(true);
          }}
          onCancel={async (id) => {
            await patchWaitlistEntry(id, { status: "LEFT" });
            await load(true);
          }}
          onSeat={async (entry, tableId) => {
            try {
              await seatFromWaitlist(entry.id, { tableId });
              setMsg(`Queue #${entry.queueNumber} seated.`);
              setTab("floor");
              setSelectedTableId(tableId);
              await load(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not seat from queue");
            }
          }}
        />
      )}

      {!branchRequired && tab === "reservations" && (
        <DineInBookingsPanel
          reservations={reservations}
          tables={tables}
          graceMin={graceMin}
          nowMs={clock}
          loading={loading}
          historyView={historyView}
          isManager={isManager}
          onToggleHistory={() => setHistoryView((v) => !v)}
          onNewBooking={() => setResFormOpen(true)}
          onConfirm={async (id, tableId) => {
            await confirmReservation(id, tableId);
            await load(true);
          }}
          onReject={async (id, reason) => {
            await rejectReservation(id, reason);
            await load(true);
          }}
          onCancel={async (id) => {
            await patchReservation(id, { status: "CANCELLED" });
            await load(true);
          }}
          onNoShow={async (id) => {
            await markNoShow(id);
            await load(true);
          }}
          onAssignTable={async (id, tableId) => {
            await patchReservation(id, { tableId });
            await load(true);
          }}
          onSeatNow={(r) => {
            if (r.tableId) {
              const t = tables.find((x) => x.id === r.tableId);
              if (t) {
                setTab("floor");
                setSelectedTableId(t.id);
                openSeatModal(t, "booking", r.id);
                return;
              }
            }
            setPickTableBooking({
              id: r.id,
              guestName: r.guestName || r.customerName || "Guest",
              partySize: r.partySize,
            });
          }}
          onChangeSeat={(r) => {
            setTab("floor");
            setSeatReservationId(r.id);
            setMsg(`Change seat for ${r.guestName || r.customerName}: pick a table on the floor and seat from the booking list in the modal.`);
          }}
        />
      )}

      {floorFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setFloorFormOpen(false)} />
          <form
            onSubmit={addFloor}
            className="relative w-full max-w-md animate-fade-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900"
          >
            <h2 className="text-lg font-bold">Add dining floor</h2>
            <p className="mt-1 text-sm text-stone-500">Examples: Ground floor, Terrace, Family hall (takht), VIP room.</p>
            <div className="mt-4 space-y-3">
              <input
                className="input"
                placeholder="Floor name"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">Create floor</button>
          </form>
        </div>
      )}

      {tableFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setTableFormOpen(false)} />
          <form
            onSubmit={addTable}
            className="relative w-full max-w-md animate-fade-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900"
          >
            <h2 className="text-lg font-bold">Add seat</h2>
            <p className="mt-1 text-sm text-stone-500">Pick the floor and seating style so staff can read the map at a glance.</p>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Label (e.g. T7, TK2)" value={tableLabel} onChange={(e) => setTableLabel(e.target.value)} required />
              <input className="input" placeholder="Seats" value={tableCapacity} onChange={(e) => setTableCapacity(e.target.value)} />
              <select className="input" value={tableFloorId} onChange={(e) => setTableFloorId(e.target.value)} required>
                <option value="">Which floor?</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select className="input" value={tableSeatType} onChange={(e) => setTableSeatType(e.target.value as SeatType)}>
                <option value="TABLE">Table (round)</option>
                <option value="TAKHT">Takht / floor seating</option>
                <option value="BOOTH">Booth</option>
                <option value="HIGH_TOP">High top</option>
                <option value="OUTDOOR">Outdoor table</option>
              </select>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={!tableFloorId}>Add to map</button>
          </form>
        </div>
      )}

      {seatTarget && (
        <SeatGuestsModal
          table={seatTarget}
          reservations={reservations}
          graceMin={graceMin}
          nowMs={clock}
          isManager={isManager}
          guestName={guestName}
          partySize={partySize}
          waiterId={waiterId}
          waiters={waiters}
          seatMode={seatMode}
          onSeatModeChange={setSeatMode}
          selectedReservationId={seatReservationId}
          onSelectReservation={setSeatReservationId}
          walkInForce={seatForce}
          onGuestName={setGuestName}
          onPartySize={setPartySize}
          onWaiterId={setWaiterId}
          onWalkInForce={setSeatForce}
          onClose={() => setSeatTarget(null)}
          onSubmit={handleOpenSession}
        />
      )}

      {resFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setResFormOpen(false)} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!resName.trim() || !resEmail.trim() || !resPhone.trim() || !resWhen) return;
              try {
                const { reservation } = await createReservation({
                  guestName: resName.trim(),
                  guestEmail: resEmail.trim(),
                  guestPhone: resPhone.trim(),
                  partySize: Number(resParty) || 2,
                  startsAt: new Date(resWhen).toISOString(),
                  notes: resNotes.trim() || undefined,
                  tableId: resTableId || undefined,
                });
                setReservations((prev) => {
                  const next = [...prev.filter((r) => r.id !== reservation.id), reservation];
                  next.sort((a, b) => new Date(a.reservedAt).getTime() - new Date(b.reservedAt).getTime());
                  return next;
                });
                setTab("reservations");
                setResFormOpen(false);
                setResName("");
                setResPhone("");
                setResWhen("");
                setResTableId("");
                setResNotes("");
                setMsg("Booking saved as pending — manager must confirm before the guest is promised a seat.");
                void load(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save reservation");
              }
            }}
            className="relative w-full max-w-md animate-fade-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={18} className="text-brand-600" /> New booking
            </h2>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Guest name" value={resName} onChange={(e) => setResName(e.target.value)} required />
              <input className="input" type="email" placeholder="Email (required)" value={resEmail} onChange={(e) => setResEmail(e.target.value)} required />
              <input className="input" placeholder="Phone (03XXXXXXXXX)" value={resPhone} onChange={(e) => setResPhone(e.target.value)} required />
              <input className="input" placeholder="Party size" value={resParty} onChange={(e) => setResParty(e.target.value)} />
              <input className="input" type="datetime-local" value={resWhen} onChange={(e) => setResWhen(e.target.value)} required />
              <select className="input" value={resTableId} onChange={(e) => setResTableId(e.target.value)}>
                <option value="">Assign seat later (optional)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.zone} · {t.label} ({t.capacity} seats)
                  </option>
                ))}
              </select>
              <textarea className="input min-h-[72px]" placeholder="Notes" value={resNotes} onChange={(e) => setResNotes(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">Save booking</button>
          </form>
        </div>
      )}

      {pickTableBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => setPickTableBooking(null)} />
          <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900">
            <h2 className="text-lg font-bold">Seat {pickTableBooking.guestName}</h2>
            <p className="mt-1 text-sm text-stone-500">Pick a free table with enough seats ({pickTableBooking.partySize} guests).</p>
            <ul className="mt-4 space-y-2">
              {tables
                .filter((t) => t.status === "AVAILABLE" && t.capacity >= pickTableBooking.partySize)
                .map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-left text-sm font-semibold hover:border-brand-400 dark:border-stone-600"
                      onClick={async () => {
                        try {
                          await seatReservation(pickTableBooking.id, { tableId: t.id, partySize: pickTableBooking.partySize });
                          setPickTableBooking(null);
                          setSelectedTableId(t.id);
                          setMsg(`Seated at ${t.label}.`);
                          await load(true);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Could not seat");
                        }
                      }}
                    >
                      {t.zone} · {t.label} ({t.capacity} seats)
                    </button>
                  </li>
                ))}
            </ul>
            {tables.filter((t) => t.status === "AVAILABLE" && t.capacity >= pickTableBooking.partySize).length === 0 && (
              <p className="mt-3 text-sm text-amber-700">No vacant tables with enough capacity — add a seat or choose another table.</p>
            )}
          </div>
        </div>
      )}

      <ConfirmSheet
        open={Boolean(closeTarget)}
        title={closeForce ? `Force close table ${closeTarget?.label}?` : `Close table ${closeTarget?.label}?`}
        message={
          closeForce
            ? "Unsettled kitchen tickets or unpaid orders will be overridden. This is recorded in the audit log."
            : "Guests must be billed and kitchen tickets finished. If blocked, managers can force close with a reason."
        }
        confirmLabel={closeForce ? "Force close" : "Close table"}
        danger={closeForce}
        saving={closing}
        onClose={() => {
          setCloseTarget(null);
          setCloseForce(false);
          setCloseReason("");
        }}
        reasonLabel={closeForce && isManager ? "Force-close reason" : undefined}
        reasonPlaceholder={closeForce && isManager ? "Why are you closing with open tickets?" : undefined}
        reasonRequired={closeForce && isManager}
        onConfirm={async (reason) => {
          if (!closeTarget) return;
          setClosing(true);
          setError("");
          try {
            await closeTableSession(closeTarget.sessionId, closeForce && isManager, reason || closeReason || undefined);
            setCloseTarget(null);
            setCloseForce(false);
            setCloseReason("");
            setMsg(`Table ${closeTarget.label} closed — mark clean when ready.`);
            await load(true);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Could not close session";
            if (!closeForce && isManager && message.toLowerCase().includes("blocked")) {
              setCloseForce(true);
              setError("Close blocked — confirm again with a force-close reason.");
            } else {
              setError(message);
            }
          } finally {
            setClosing(false);
          }
        }}
      />

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        title={`Remove table ${deleteTarget?.label}?`}
        message="Only do this if the table no longer exists on your floor plan. Open sessions must be closed first."
        confirmLabel="Remove"
        danger
        saving={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await deleteTable(deleteTarget.id);
            setDeleteTarget(null);
            setSelectedTableId(null);
            await load(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete table");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
