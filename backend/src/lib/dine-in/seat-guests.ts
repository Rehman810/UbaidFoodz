import {
  Prisma,
  ReservationStatus,
  TableSessionStatus,
  TableStatus,
} from "@prisma/client";
import { prisma } from "../prisma";
import { assertReservationTransition } from "./reservation-machine";
import { writeAuditLog } from "./audit";
import { tableBlockedForSlot, reservationEnd } from "./availability";

import { seatingWindowError } from "./seating-window";

const RESERVED_SOON_MIN = 60;

export type SeatGuestsInput = {
  branchId: string;
  tableId: string;
  actorId?: string;
  reservationId?: string;
  guestName?: string;
  partySize?: number;
  waiterId?: string;
  notes?: string;
  force?: boolean;
};

export type SeatGuestsResult = {
  sessionId: string;
  tableId: string;
  reservationId: string | null;
};

function httpError(status: number, message: string, code?: string) {
  const err = new Error(message);
  Object.assign(err, { status, code });
  return err;
}

export async function seatGuests(input: SeatGuestsInput): Promise<SeatGuestsResult> {
  const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
  if (!branch) throw httpError(404, "Branch not found.");

  const table = await prisma.diningTable.findFirst({
    where: { id: input.tableId, branchId: input.branchId },
  });
  if (!table) throw httpError(404, "Table not found.");

  if (table.status === TableStatus.NEEDS_CLEANING) {
    throw httpError(409, "Table needs cleaning before seating.", "NEEDS_CLEANING");
  }

  const openSession = await prisma.tableSession.findFirst({
    where: { tableId: table.id, closedAt: null },
  });
  if (openSession) throw httpError(409, "Table already has an open session.", "TABLE_TAKEN");

  const now = new Date();
  let reservation = null;

  if (input.reservationId) {
    reservation = await prisma.reservation.findFirst({
      where: { id: input.reservationId, branchId: input.branchId },
    });
    if (!reservation) throw httpError(404, "Reservation not found.");
    const windowErr = seatingWindowError(now, reservation.startsAt, branch.graceMin, reservation.status);
    if (windowErr === "NOT_CONFIRMED") throw httpError(409, "Only confirmed bookings can be seated.", "NOT_CONFIRMED");
    if (windowErr === "TOO_EARLY") throw httpError(409, "Too early to seat this booking.", "TOO_EARLY");
    if (windowErr === "GRACE_EXPIRED") throw httpError(409, "Grace period expired — seat as walk-in.", "GRACE_EXPIRED");

    if (reservation.tableId && reservation.tableId !== table.id) {
      throw httpError(409, "Booking is assigned to a different table.", "WRONG_TABLE");
    }
  } else {
    const soon = await prisma.reservation.findFirst({
      where: {
        branchId: input.branchId,
        tableId: table.id,
        status: ReservationStatus.CONFIRMED,
        startsAt: {
          gte: now,
          lte: new Date(now.getTime() + RESERVED_SOON_MIN * 60_000),
        },
      },
    });
    if (soon && !input.force) {
      throw httpError(
        409,
        "This table has a confirmed booking starting soon.",
        "TABLE_RESERVED_SOON"
      );
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.tableSession.create({
        data: {
          branchId: input.branchId,
          tableId: table.id,
          guestName:
            input.guestName?.trim() ||
            reservation?.guestName ||
            "Walk-in",
          partySize: Math.max(1, Number(input.partySize) || reservation?.partySize || 2),
          waiterId: input.waiterId || null,
          notes: input.notes?.trim() || null,
          reservationId: reservation?.id ?? null,
        },
      });

      await tx.diningTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });

      if (reservation) {
        assertReservationTransition(reservation.status, ReservationStatus.SEATED);
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: ReservationStatus.SEATED,
            tableId: table.id,
          },
        });
      }

      return created;
    });

    await writeAuditLog({
      branchId: input.branchId,
      actorId: input.actorId,
      action: reservation ? "reservation.seat" : "table.walk_in_seat",
      entity: "TableSession",
      entityId: result.id,
      meta: { tableId: table.id, reservationId: reservation?.id ?? null },
    });

    return { sessionId: result.id, tableId: table.id, reservationId: reservation?.id ?? null };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw httpError(409, "Table was just taken by someone else.", "TABLE_TAKEN");
    }
    throw err;
  }
}

export async function assertTableAssignable(
  branchId: string,
  tableId: string,
  startsAt: Date,
  durationMin: number,
  partySize: number,
  excludeReservationId?: string
) {
  const table = await prisma.diningTable.findFirst({ where: { id: tableId, branchId } });
  if (!table) throw httpError(400, "Table not found.");
  if (table.capacity < partySize) throw httpError(409, "Table capacity is too small for this party.");

  const [reservations, sessions] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        branchId,
        OR: [{ tableId }, { tableId: null }],
        status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED] },
      },
    }),
    prisma.tableSession.findMany({
      where: { branchId, tableId },
    }),
  ]);

  const blocked = tableBlockedForSlot(
    tableId,
    startsAt,
    durationMin,
    reservations.map((r) => ({
      id: r.id,
      tableId: r.tableId,
      startsAt: r.startsAt,
      durationMin: r.durationMin,
      status: r.status,
    })),
    sessions.map((s) => ({
      tableId: s.tableId,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      status: s.status,
    })),
    excludeReservationId
  );
  if (blocked) throw httpError(409, "This table is not available for that time slot.");
}
