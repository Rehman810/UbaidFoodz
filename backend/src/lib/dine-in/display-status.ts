import { ReservationStatus, TableStatus } from "@prisma/client";

export type DisplayTableStatus = "AVAILABLE" | "SEATED" | "RESERVED" | "CLEANING";

type ReservationSlice = {
  status: ReservationStatus;
  startsAt: Date;
};

const HELD_BEFORE_MIN = 60;

export function resolveDisplayStatus(
  dbStatus: TableStatus,
  hasOpenSession: boolean,
  reservations: ReservationSlice[],
  now: Date,
  graceMin: number
): DisplayTableStatus {
  if (hasOpenSession) return "SEATED";
  if (dbStatus === TableStatus.NEEDS_CLEANING) return "CLEANING";

  const held = reservations.some((r) => {
    if (r.status !== ReservationStatus.CONFIRMED) return false;
    const start = r.startsAt.getTime();
    const windowStart = start - HELD_BEFORE_MIN * 60_000;
    const windowEnd = start + graceMin * 60_000;
    const t = now.getTime();
    return t >= windowStart && t <= windowEnd;
  });
  if (held) return "RESERVED";
  return "AVAILABLE";
}

/** Map display status to legacy API enum for frontend compatibility */
export function displayToLegacyStatus(d: DisplayTableStatus): TableStatus {
  switch (d) {
    case "SEATED":
      return TableStatus.OCCUPIED;
    case "RESERVED":
      return TableStatus.RESERVED;
    case "CLEANING":
      return TableStatus.NEEDS_CLEANING;
    default:
      return TableStatus.AVAILABLE;
  }
}
