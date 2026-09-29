import { coerceSchedule, defaultClosedMessage, hoursText, isKitchenOpen, nextOpening } from "./hours";

export type DayPeriod = "AM" | "PM";

export function formatTime12(h: number, m: number) {
  const period: DayPeriod = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
}

export function storeHoursLabel(
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number
) {
  return `${formatTime12(openHour, openMinute)} – ${formatTime12(closeHour, closeMinute)}`;
}

export function to12HourParts(hour24: number, minute: number) {
  const period: DayPeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, period };
}

export function from12HourParts(hour12: number, minute: number, period: DayPeriod) {
  const normalized = hour12 % 12;
  const hour = period === "PM" ? normalized + 12 : normalized;
  return { hour, minute };
}

export function getZonedMinutes(now = new Date(), timeZone = "Asia/Karachi") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isWithinHours(
  nowMinutes: number,
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number
) {
  const open = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;
  if (open === close) return true;
  if (open < close) return nowMinutes >= open && nowMinutes < close;
  return nowMinutes >= open || nowMinutes < close;
}

type HoursSettings = {
  forceClosed: boolean;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  timezone?: string;
  weeklySchedule?: unknown;
  closedMessage?: string;
};

function scheduleOf(settings: HoursSettings) {
  return coerceSchedule(settings.weeklySchedule, settings);
}

export function isStoreOpen(settings: HoursSettings, now = new Date()) {
  return isKitchenOpen(
    { forceClosed: settings.forceClosed, timezone: settings.timezone, schedule: scheduleOf(settings) },
    now
  );
}

export function scheduleHoursLabel(settings: HoursSettings) {
  return hoursText(scheduleOf(settings));
}

export function generatedClosedMessage(settings: HoursSettings, now = new Date()) {
  return defaultClosedMessage(scheduleOf(settings), settings.timezone || "Asia/Karachi", now);
}

export function storeStatusLabel(settings: HoursSettings, now = new Date()) {
  const open = isStoreOpen(settings, now);
  const hours = scheduleHoursLabel(settings);
  if (open) return `Open now · ${hours}`;
  const next = nextOpening(scheduleOf(settings), settings.timezone || "Asia/Karachi", now);
  return next ? `Closed · Opens ${next.label}` : "Closed";
}
