import { OrderStatus, ReservationStatus, TableSessionStatus, TableStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { writeAuditLog } from "./audit";
import { enqueueForReservation } from "./email-queue";

const BLOCKING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_CONFIRMATION,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
];

function httpError(status: number, message: string, code?: string) {
  const err = new Error(message);
  Object.assign(err, { status, code });
  return err;
}

export async function closeTableSession(input: {
  sessionId: string;
  branchId: string;
  actorId?: string;
  force?: boolean;
  forceReason?: string;
}) {
  const session = await prisma.tableSession.findFirst({
    where: { id: input.sessionId, branchId: input.branchId, status: TableSessionStatus.OPEN },
    include: {
      orders: { select: { id: true, status: true, paymentStatus: true } },
      reservation: true,
    },
  });
  if (!session) throw httpError(404, "Session not found.");

  const unpaid = session.orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== OrderStatus.CANCELLED);
  const kitchenOpen = session.orders.filter(
    (o) => o.status !== OrderStatus.CANCELLED && BLOCKING_ORDER_STATUSES.includes(o.status)
  );

  if (!input.force && (unpaid.length > 0 || kitchenOpen.length > 0)) {
    throw httpError(
      409,
      "Close blocked: settle payment and finish kitchen tickets first.",
      "ORDERS_BLOCKING"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.tableSession.update({
      where: { id: session.id },
      data: { status: TableSessionStatus.CLOSED, closedAt: new Date() },
    });
    await tx.diningTable.update({
      where: { id: session.tableId },
      data: { status: TableStatus.NEEDS_CLEANING },
    });
    if (session.reservationId) {
      await tx.reservation.update({
        where: { id: session.reservationId },
        data: { status: ReservationStatus.COMPLETED },
      });
    }
  });

  await writeAuditLog({
    branchId: input.branchId,
    actorId: input.actorId,
    action: input.force ? "session.force_close" : "session.close",
    entity: "TableSession",
    entityId: session.id,
    meta: input.force ? { reason: input.forceReason ?? "" } : undefined,
  });

}
