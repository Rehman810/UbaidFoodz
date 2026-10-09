import { SeatType, WaitlistStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { branchDayRangeUtc } from "./branch-time";

export const DEFAULT_MINUTES_PER_PARTY_AHEAD = 12;

export function branchQueueDate(timezone: string, ref = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
}

export async function nextQueueNumber(branchId: string, queueDate: string) {
  const last = await prisma.waitlistEntry.findFirst({
    where: { branchId, queueDate },
    orderBy: { queueNumber: "desc" },
    select: { queueNumber: true },
  });
  return (last?.queueNumber ?? 0) + 1;
}

export type WaitlistRow = {
  id: string;
  queueNumber: number;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  preferredSeatType: SeatType | null;
  preferredTable: { id: string; label: string; seatType: SeatType } | null;
  status: WaitlistStatus;
  notes: string | null;
  createdAt: string;
  calledAt: string | null;
  position: number;
  partiesAhead: number;
  estimatedWaitMin: number;
  waitingMin: number;
};

function seatTypeLabel(t: SeatType | null) {
  if (!t) return "Any seating";
  const map: Record<SeatType, string> = {
    TABLE: "Table",
    TAKHT: "Takht",
    BOOTH: "Booth",
    HIGH_TOP: "High top",
    OUTDOOR: "Outdoor",
  };
  return map[t];
}

export function estimateWaitMinutes(partiesAhead: number, partySize: number, minPerParty = DEFAULT_MINUTES_PER_PARTY_AHEAD) {
  const sizeBump = Math.max(0, partySize - 4) * 3;
  return Math.max(5, partiesAhead * minPerParty + sizeBump);
}

export function enrichWaitlistEntries(
  entries: {
    id: string;
    queueNumber: number;
    guestName: string;
    guestPhone: string | null;
    partySize: number;
    preferredSeatType: SeatType | null;
    preferredTable: { id: string; label: string; seatType: SeatType } | null;
    status: WaitlistStatus;
    notes: string | null;
    createdAt: Date;
    calledAt: Date | null;
  }[],
  now = new Date(),
  minPerParty = DEFAULT_MINUTES_PER_PARTY_AHEAD
): WaitlistRow[] {
  const active = entries.filter((e) => e.status === WaitlistStatus.WAITING || e.status === WaitlistStatus.CALLED);
  return entries.map((e) => {
    const ahead = active.filter(
      (o) =>
        (o.status === WaitlistStatus.WAITING || o.status === WaitlistStatus.CALLED) &&
        (o.createdAt < e.createdAt || (o.createdAt.getTime() === e.createdAt.getTime() && o.queueNumber < e.queueNumber))
    ).length;
    const position =
      e.status === WaitlistStatus.WAITING || e.status === WaitlistStatus.CALLED
        ? ahead + 1
        : 0;
    const waitingMin = Math.max(0, Math.floor((now.getTime() - e.createdAt.getTime()) / 60_000));
    return {
      id: e.id,
      queueNumber: e.queueNumber,
      guestName: e.guestName,
      guestPhone: e.guestPhone,
      partySize: e.partySize,
      preferredSeatType: e.preferredSeatType,
      preferredTable: e.preferredTable,
      status: e.status,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
      calledAt: e.calledAt?.toISOString() ?? null,
      position,
      partiesAhead: ahead,
      estimatedWaitMin:
        e.status === WaitlistStatus.WAITING || e.status === WaitlistStatus.CALLED
          ? estimateWaitMinutes(ahead, e.partySize, minPerParty)
          : 0,
      waitingMin,
    };
  });
}

export { seatTypeLabel };

export async function listWaitlistForBranch(branchId: string, timezone: string, includeDone = false) {
  const queueDate = branchQueueDate(timezone);
  const { startUtc, endUtc } = branchDayRangeUtc(timezone);
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      branchId,
      queueDate,
      ...(includeDone
        ? {}
        : { status: { in: [WaitlistStatus.WAITING, WaitlistStatus.CALLED] } }),
    },
    orderBy: [{ queueNumber: "asc" }],
    include: {
      preferredTable: { select: { id: true, label: true, seatType: true } },
    },
  });
  const rows = enrichWaitlistEntries(entries);
  const waitingCount = rows.filter((r) => r.status === WaitlistStatus.WAITING || r.status === WaitlistStatus.CALLED).length;
  return { queueDate, startUtc, endUtc, waitingCount, entries: rows };
}
