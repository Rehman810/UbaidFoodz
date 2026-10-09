import { ReservationStatus, TableSessionStatus } from "@prisma/client";

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function reservationEnd(startsAt: Date, durationMin: number) {
  return new Date(startsAt.getTime() + durationMin * 60_000);
}

export type OverlapReservation = {
  id: string;
  tableId: string | null;
  startsAt: Date;
  durationMin: number;
  status: ReservationStatus;
};

export type OverlapSession = {
  tableId: string;
  openedAt: Date;
  closedAt: Date | null;
  status: TableSessionStatus;
};

export function tableBlockedForSlot(
  tableId: string,
  startsAt: Date,
  durationMin: number,
  reservations: OverlapReservation[],
  sessions: OverlapSession[],
  excludeReservationId?: string
): boolean {
  const end = reservationEnd(startsAt, durationMin);
  const activeStatuses: ReservationStatus[] = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.SEATED,
  ];

  for (const r of reservations) {
    if (r.id === excludeReservationId) continue;
    if (!activeStatuses.includes(r.status)) continue;
    if (r.tableId !== tableId) continue;
    const rEnd = reservationEnd(r.startsAt, r.durationMin);
    if (intervalsOverlap(startsAt, end, r.startsAt, rEnd)) return true;
  }

  for (const s of sessions) {
    if (s.tableId !== tableId) continue;
    if (s.status !== TableSessionStatus.OPEN && s.closedAt) continue;
    const sEnd = s.closedAt ?? new Date(startsAt.getTime() + 4 * 60 * 60_000);
    if (intervalsOverlap(startsAt, end, s.openedAt, sEnd)) return true;
  }
  return false;
}

export function branchHasCapacity(
  tableCapacities: { id: string; capacity: number }[],
  partySize: number,
  startsAt: Date,
  durationMin: number,
  reservations: OverlapReservation[],
  sessions: OverlapSession[],
  excludeReservationId?: string
): boolean {
  return tableCapacities.some(
    (t) =>
      t.capacity >= partySize &&
      !tableBlockedForSlot(t.id, startsAt, durationMin, reservations, sessions, excludeReservationId)
  );
}
