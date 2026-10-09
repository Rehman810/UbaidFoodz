import { prisma } from "../prisma";
import { sendEmail } from "../email";
import { bookingEmailContent } from "./booking-email-templates";

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 60_000, 300_000];

export type BookingEmailType =
  | "BOOKING_RECEIVED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REJECTED"
  | "BOOKING_REMINDER"
  | "BOOKING_NO_SHOW"
  | "BOOKING_CANCELLED"
  | "FOLLOW_UP_THANKS"
  | "MANAGER_PENDING";

export async function enqueueReservationEmail(
  reservationId: string,
  type: BookingEmailType,
  toEmail: string,
  context: Record<string, unknown>
) {
  const log = await prisma.emailLog.create({
    data: {
      reservationId,
      type,
      toEmail: toEmail.trim().toLowerCase(),
      status: "PENDING",
    },
  });
  void processEmailLog(log.id, type, toEmail, context).catch(() => {});
  return log.id;
}

export async function resendEmailLog(emailLogId: string) {
  const log = await prisma.emailLog.findUnique({ where: { id: emailLogId } });
  if (!log) return false;
  const reservation = await prisma.reservation.findUnique({
    where: { id: log.reservationId },
    include: { branch: true, table: { include: { floor: true } } },
  });
  if (!reservation) return false;
  const context = await buildContextFromReservation(reservation);
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: { status: "PENDING", error: null },
  });
  return processEmailLog(emailLogId, log.type as BookingEmailType, log.toEmail, context);
}

async function buildContextFromReservation(
  reservation: {
    guestName: string;
    guestEmail: string;
    partySize: number;
    startsAt: Date;
    durationMin: number;
    confirmationToken: string;
    branch: { name: string; address: string; phone: string; timezone: string; graceMin: number };
    table: { label: string; floor: { name: string } | null } | null;
    rejectionReason: string | null;
  }
) {
  const baseUrl = (process.env.PUBLIC_BASE_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    guestName: reservation.guestName,
    partySize: reservation.partySize,
    startsAtIso: reservation.startsAt.toISOString(),
    timezone: reservation.branch.timezone,
    graceMin: reservation.branch.graceMin,
    branchName: reservation.branch.name,
    branchAddress: reservation.branch.address,
    branchPhone: reservation.branch.phone,
    tableLabel: reservation.table?.label ?? null,
    floorName: reservation.table?.floor?.name ?? null,
    cancelUrl: `${baseUrl}/book/cancel?token=${reservation.confirmationToken}`,
    rejectionReason: reservation.rejectionReason,
  };
}

async function processEmailLog(
  logId: string,
  type: BookingEmailType,
  toEmail: string,
  context: Record<string, unknown>
) {
  const log = await prisma.emailLog.findUnique({ where: { id: logId } });
  if (!log || log.status === "SENT") return true;

  const attempt = log.attempts + 1;
  const { subject, html, text } = bookingEmailContent(type, context);

  try {
    const ok = await sendEmail(toEmail, subject, html, text);
    if (ok) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: "SENT", sentAt: new Date(), attempts: attempt, error: null },
      });
      return true;
    }
    throw new Error("SMTP send returned false");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    const failed = attempt >= MAX_ATTEMPTS;
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: failed ? "FAILED" : "PENDING",
        attempts: attempt,
        error: message,
      },
    });
    if (!failed) {
      const delay = BACKOFF_MS[attempt] ?? 300_000;
      setTimeout(() => {
        void processEmailLog(logId, type, toEmail, context);
      }, delay);
    }
    return false;
  }
}

export async function processPendingEmailQueue(limit = 20) {
  const pending = await prisma.emailLog.findMany({
    where: { status: "PENDING", attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      reservation: { include: { branch: true, table: { include: { floor: true } } } },
    },
  });
  for (const row of pending) {
    const ctx = await buildContextFromReservation(row.reservation);
    await processEmailLog(row.id, row.type as BookingEmailType, row.toEmail, ctx);
  }
}

export async function enqueueForReservation(reservationId: string, type: BookingEmailType, extra?: Record<string, unknown>) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { branch: true, table: { include: { floor: true } } },
  });
  if (!reservation || reservation.emailMissingLegacy) return null;
  const context = { ...(await buildContextFromReservation(reservation)), ...extra };
  if (type === "MANAGER_PENDING") {
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
      select: { email: true },
    });
    for (const m of managers) {
      if (m.email) await enqueueReservationEmail(reservationId, type, m.email, context);
    }
    return null;
  }
  return enqueueReservationEmail(reservationId, type, reservation.guestEmail, context);
}

export async function reservationEmailSummary(reservationId: string) {
  const logs = await prisma.emailLog.findMany({
    where: { reservationId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const latestFailed = logs.find((l) => l.status === "FAILED");
  return {
    logs: logs.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      attempts: l.attempts,
      sentAt: l.sentAt?.toISOString() ?? null,
      error: l.error,
    })),
    hasFailed: Boolean(latestFailed),
    lastFailedId: latestFailed?.id ?? null,
  };
}
