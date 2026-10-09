import { ReservationStatus } from "@prisma/client";

const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: [ReservationStatus.CONFIRMED, ReservationStatus.REJECTED, ReservationStatus.CANCELLED],
  CONFIRMED: [ReservationStatus.SEATED, ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
  REJECTED: [],
  SEATED: [ReservationStatus.COMPLETED],
  CANCELLED: [],
  NO_SHOW: [],
  COMPLETED: [],
};

export function canTransitionReservation(from: ReservationStatus, to: ReservationStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertReservationTransition(from: ReservationStatus, to: ReservationStatus) {
  if (!canTransitionReservation(from, to)) {
    const err = new Error(`Cannot move reservation from ${from} to ${to}.`);
    Object.assign(err, { status: 409, code: "INVALID_TRANSITION" });
    throw err;
  }
}
