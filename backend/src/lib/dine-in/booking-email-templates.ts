import type { BookingEmailType } from "./email-queue";
import { formatInBranchTz } from "./branch-time";

export function bookingEmailContent(type: BookingEmailType, ctx: Record<string, unknown>) {
  const guestName = String(ctx.guestName ?? "Guest");
  const branchName = String(ctx.branchName ?? "Restaurant");
  const startsAt = ctx.startsAtIso ? formatInBranchTz(String(ctx.startsAtIso), String(ctx.timezone ?? "Asia/Karachi")) : "";
  const graceMin = Number(ctx.graceMin ?? 15);
  const partySize = Number(ctx.partySize ?? 2);
  const cancelUrl = String(ctx.cancelUrl ?? "");
  const tableLabel = ctx.tableLabel ? String(ctx.tableLabel) : null;
  const floorName = ctx.floorName ? String(ctx.floorName) : null;
  const rejectionReason = ctx.rejectionReason ? String(ctx.rejectionReason) : "";

  const seatLine = tableLabel
    ? `Table ${tableLabel}${floorName ? ` (${floorName})` : ""}`
    : "We will assign your table when you arrive.";

  let subject = `${branchName} — booking update`;
  let headline = "Booking update";
  let body = "";

  switch (type) {
    case "BOOKING_RECEIVED":
      subject = `${branchName} — we received your booking request`;
      headline = "Request received (not confirmed yet)";
      body = `Hi ${guestName},\n\nWe received your request for ${partySize} guests on ${startsAt}.\n\nThis is NOT a confirmed reservation until our manager approves it. You will receive another email when confirmed.\n\nCancel request: ${cancelUrl}`;
      break;
    case "BOOKING_CONFIRMED":
      subject = `${branchName} — booking confirmed`;
      headline = "Your table is confirmed";
      body = `Hi ${guestName},\n\nYour booking is confirmed for ${startsAt}, party of ${partySize}.\n${seatLine}\n\nPlease arrive on time. Your seat is held for ${graceMin} minutes after ${startsAt}; after that the booking is released.\n\nCancel: ${cancelUrl}`;
      break;
    case "BOOKING_REJECTED":
      subject = `${branchName} — booking update`;
      headline = "We could not confirm your booking";
      body = `Hi ${guestName},\n\nWe were unable to confirm your request for ${startsAt}.${rejectionReason ? `\nReason: ${rejectionReason}` : ""}\n\nYou can book another time on our website.`;
      break;
    case "BOOKING_REMINDER":
      subject = `${branchName} — reminder for today`;
      headline = "See you soon";
      body = `Hi ${guestName},\n\nReminder: ${startsAt}, party of ${partySize}. ${seatLine}\n\nArrive on time — we hold your seat for ${graceMin} minutes after your booking time.\n\nCancel: ${cancelUrl}`;
      break;
    case "BOOKING_NO_SHOW":
      subject = `${branchName} — missed reservation`;
      headline = "We missed you";
      body = `Hi ${guestName},\n\nWe released your table after the ${graceMin}-minute grace period for ${startsAt}. You're welcome to visit as a walk-in if we have space, or book again online.`;
      break;
    case "BOOKING_CANCELLED":
      subject = `${branchName} — booking cancelled`;
      headline = "Booking cancelled";
      body = `Hi ${guestName},\n\nYour booking for ${startsAt} has been cancelled.`;
      break;
    case "FOLLOW_UP_THANKS":
      subject = `${branchName} — thank you for dining with us`;
      headline = "Thank you!";
      body = `Hi ${guestName},\n\nThanks for dining with us. We'd love your feedback — tell us how we did on your next visit.`;
      break;
    case "MANAGER_PENDING":
      subject = `${branchName} — new booking needs confirmation`;
      headline = "Pending booking";
      body = `New booking request: ${guestName}, ${partySize} guests, ${startsAt}. Please confirm or reject in the admin dine-in panel.`;
      break;
  }

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5"><h2>${headline}</h2><p>${body.replace(/\n/g, "<br/>")}</p><p style="color:#666;font-size:12px">${branchName}</p></body></html>`;
  return { subject, html, text: body };
}
