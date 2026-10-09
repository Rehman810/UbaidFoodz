import { api } from "@/lib/api";

export type SeatType = "TABLE" | "TAKHT" | "BOOTH" | "HIGH_TOP" | "OUTDOOR";

export type DiningFloorRow = {
  id: string;
  name: string;
  sortOrder: number;
  tableCount?: number;
};

export type FloorTable = {
  id: string;
  label: string;
  capacity: number;
  seatType: SeatType;
  zone: string;
  floorId: string | null;
  floor: { id: string; name: string; sortOrder: number } | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "NEEDS_CLEANING";
  displayStatus?: "AVAILABLE" | "SEATED" | "RESERVED" | "CLEANING";
  activeSession: {
    id: string;
    guestName: string;
    partySize: number;
    openedAt: string;
    waiter: { id: string; name: string } | null;
    orderCount: number;
    runningTotal: number;
  } | null;
  nextReservation: {
    id: string;
    reservedAt: string;
    startsAt?: string;
    partySize: number;
    customerName: string;
    status: string;
  } | null;
};

export type ReservationRow = {
  id: string;
  branchId: string;
  tableId: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  partySize: number;
  startsAt: string;
  reservedAt: string;
  durationMin: number;
  status: string;
  notes: string | null;
  createdAt: string;
  emailMissingLegacy?: boolean;
  table: { id: string; label: string } | null;
  email?: {
    hasFailed: boolean;
    lastFailedId: string | null;
    logs: { id: string; type: string; status: string; error: string | null }[];
  };
};

export async function fetchPendingBookingsCount() {
  return api<{ count: number }>("/admin/dine-in/pending-count");
}

export type WaitlistEntryRow = {
  id: string;
  queueNumber: number;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  preferredSeatType: SeatType | null;
  preferredTable: { id: string; label: string; seatType: SeatType } | null;
  status: "WAITING" | "CALLED" | "SEATED" | "CANCELLED" | "LEFT";
  notes: string | null;
  createdAt: string;
  calledAt: string | null;
  position: number;
  partiesAhead: number;
  estimatedWaitMin: number;
  waitingMin: number;
};

export async function fetchFloor() {
  return api<{
    floors: DiningFloorRow[];
    pendingBookingsCount: number;
    waitlistWaitingCount?: number;
    branchTimezone: string;
    graceMin: number;
    tables: FloorTable[];
    waiters: { id: string; name: string }[];
    unassignedReservations: {
      id: string;
      startsAt: string;
      reservedAt: string;
      partySize: number;
      customerName: string;
      guestName: string;
      status: string;
    }[];
  }>("/admin/dine-in/floor");
}

export async function createFloor(payload: { name: string; sortOrder?: number }) {
  return api<{ floor: DiningFloorRow }>("/admin/dine-in/floors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function renameFloor(id: string, name: string) {
  return api(`/admin/dine-in/floors/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export async function deleteFloor(id: string) {
  return api(`/admin/dine-in/floors/${id}`, { method: "DELETE" });
}

export async function createTable(payload: {
  label: string;
  capacity?: number;
  floorId?: string;
  seatType?: SeatType;
  sortOrder?: number;
}) {
  return api<{ table: { id: string } }>("/admin/dine-in/tables", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTable(id: string) {
  return api(`/admin/dine-in/tables/${id}`, { method: "DELETE" });
}

export async function openTableSession(
  tableId: string,
  payload: {
    guestName?: string;
    partySize?: number;
    waiterId?: string;
    notes?: string;
    reservationId?: string;
    force?: boolean;
  }
) {
  return api<{ session: FloorTable["activeSession"] }>(`/admin/dine-in/tables/${tableId}/open`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function seatReservation(
  reservationId: string,
  payload: { tableId: string; waiterId?: string; guestName?: string; partySize?: number }
) {
  return api<{ session: FloorTable["activeSession"] }>(`/admin/dine-in/reservations/${reservationId}/seat`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function closeTableSession(sessionId: string, force = false, reason?: string) {
  return api(`/admin/dine-in/sessions/${sessionId}/close`, {
    method: "POST",
    body: JSON.stringify({ force, reason }),
  });
}

export async function markTableClean(tableId: string) {
  return api(`/admin/dine-in/tables/${tableId}/clean`, { method: "POST" });
}

export async function fetchReservations(history = false) {
  return api<{ reservations: ReservationRow[] }>(
    `/admin/dine-in/reservations${history ? "?history=true" : ""}`
  );
}

export async function createReservation(payload: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  startsAt: string;
  notes?: string;
  tableId?: string;
}) {
  return api<{ reservation: ReservationRow }>("/admin/dine-in/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmReservation(id: string, tableId?: string) {
  return api<{ reservation: ReservationRow }>(`/admin/dine-in/reservations/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ tableId }),
  });
}

export async function rejectReservation(id: string, reason?: string) {
  return api<{ reservation: ReservationRow }>(`/admin/dine-in/reservations/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function patchReservation(
  id: string,
  payload: Partial<{ status: string; tableId: string | null; startsAt: string; partySize: number; notes: string }>
) {
  return api<{ reservation: ReservationRow }>(`/admin/dine-in/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function markNoShow(id: string) {
  return api<{ reservation: ReservationRow }>(`/admin/dine-in/reservations/${id}/no-show`, { method: "POST" });
}

export async function fetchWaitlist(history = false) {
  return api<{ queueDate: string; waitingCount: number; entries: WaitlistEntryRow[] }>(
    `/admin/dine-in/waitlist${history ? "?history=true" : ""}`
  );
}

export async function addToWaitlist(payload: {
  guestName: string;
  guestPhone?: string;
  partySize: number;
  preferredSeatType?: SeatType;
  preferredTableId?: string;
  notes?: string;
}) {
  return api<{ entry: WaitlistEntryRow; message: string }>("/admin/dine-in/waitlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchWaitlistEntry(id: string, payload: { status?: WaitlistEntryRow["status"]; notes?: string }) {
  return api<{ entry: WaitlistEntryRow }>(`/admin/dine-in/waitlist/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function seatFromWaitlist(
  id: string,
  payload: { tableId: string; waiterId?: string; force?: boolean }
) {
  return api<{ session: FloorTable["activeSession"]; queueNumber: number }>(`/admin/dine-in/waitlist/${id}/seat`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPublicWaitlist(branchId: string) {
  return api<{
    branchName: string;
    queueDate: string;
    updatedAt: string;
    queue: {
      queueNumber: number;
      partySize: number;
      position: number;
      estimatedWaitMin: number;
      status: string;
      seating: string;
    }[];
  }>(`/dine-in/waitlist?branchId=${encodeURIComponent(branchId)}`);
}

export async function resendReservationEmail(reservationId: string, logId: string) {
  return api<{ ok: boolean }>(`/admin/dine-in/reservations/${reservationId}/emails/${logId}/resend`, {
    method: "POST",
  });
}

export async function fetchAvailability(branchId: string, date: string, partySize: number) {
  return api<{ slots: string[] }>(
    `/dine-in/availability?branchId=${encodeURIComponent(branchId)}&date=${date}&partySize=${partySize}`
  );
}

export async function createPublicReservation(payload: {
  branchId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  startsAt: string;
  notes?: string;
  idempotencyKey?: string;
  website?: string;
}) {
  return api<{ reservation: { id: string; startsAt: string; status: string } }>("/dine-in/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelPublicReservation(token: string) {
  return api<{ ok: boolean }>(`/dine-in/reservations/cancel?token=${encodeURIComponent(token)}`, {
    method: "POST",
  });
}
