import { StoreSettings } from "@prisma/client";

export function getKarachiMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
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

export function isStoreOpen(settings: StoreSettings, now = new Date()) {
  if (settings.forceClosed) return false;
  const nowMin = getKarachiMinutes(now);
  return isWithinHours(
    nowMin,
    settings.openHour,
    settings.openMinute,
    settings.closeHour,
    settings.closeMinute
  );
}

export function formatTime12(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m.toString().padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
}

export function storeHoursLabel(settings: StoreSettings) {
  return `${formatTime12(settings.openHour, settings.openMinute)} – ${formatTime12(settings.closeHour, settings.closeMinute)}`;
}

export function effectiveItemPrice(item: {
  price: { toString(): string } | number;
  discountPrice?: { toString(): string } | number | null;
}) {
  const discount = item.discountPrice != null ? Number(item.discountPrice) : null;
  if (discount != null && discount > 0 && discount < Number(item.price)) return discount;
  return Number(item.price);
}
