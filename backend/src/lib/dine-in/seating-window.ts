import { ReservationStatus } from "@prisma/client";

const EARLY_MIN = 15;

export function seatingWindowError(
  now: Date,
  startsAt: Date,
  graceMin: number,
  status: ReservationStatus
): "NOT_CONFIRMED" | "TOO_EARLY" | "GRACE_EXPIRED" | null {
  if (status !== ReservationStatus.CONFIRMED) return "NOT_CONFIRMED";
  const early = new Date(startsAt.getTime() - EARLY_MIN * 60_000);
  const late = new Date(startsAt.getTime() + graceMin * 60_000);
  if (now < early) return "TOO_EARLY";
  if (now > late) return "GRACE_EXPIRED";
  return null;
}

export function graceMinutesRemaining(now: Date, startsAt: Date, graceMin: number): number | null {
  const late = new Date(startsAt.getTime() + graceMin * 60_000);
  if (now > late) return null;
  if (now < startsAt) return null;
  return Math.max(0, Math.ceil((late.getTime() - now.getTime()) / 60_000));
}
