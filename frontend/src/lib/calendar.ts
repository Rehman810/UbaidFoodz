import { toInputDate } from "./order-dates";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function getMondayIndex(day: number) {
  return day === 0 ? 6 : day - 1;
}

export function buildMonthGrid(view: Date) {
  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const pad = getMondayIndex(first.getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < pad; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toInputDate(new Date(year, month, d));
    cells.push({ date, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

export function monthLabel(view: Date) {
  return view.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

export function shiftMonth(view: Date, delta: number) {
  return new Date(view.getFullYear(), view.getMonth() + delta, 1);
}

export function isInRange(date: string, from: string, to: string) {
  if (!from || !to) return false;
  return date >= from && date <= to;
}

export function isRangeStart(date: string, from: string, to: string) {
  return date === from;
}

export function isRangeEnd(date: string, from: string, to: string) {
  return date === to;
}

export { WEEKDAYS };
