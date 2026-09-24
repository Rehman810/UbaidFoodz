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

export function isStoreOpen(
  settings: {
    forceClosed: boolean;
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  },
  now = new Date()
) {
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

export function storeStatusLabel(
  settings: {
    forceClosed: boolean;
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  },
  now = new Date()
) {
  const open = isStoreOpen(settings, now);
  if (open) {
    return `Open until ${formatTime12(settings.closeHour, settings.closeMinute)}`;
  }
  return `Closed · Opens ${formatTime12(settings.openHour, settings.openMinute)}`;
}
