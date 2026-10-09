export function formatBookingTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return sameDay ? `Today, ${time}` : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatTimeShort(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function minutesUntilStart(startsAt: string, nowMs: number) {
  return Math.round((new Date(startsAt).getTime() - nowMs) / 60_000);
}

export function graceEndIso(startsAt: string, graceMin: number) {
  return new Date(new Date(startsAt).getTime() + graceMin * 60_000).toISOString();
}

export function holdProgress(startsAt: string, graceMin: number, nowMs: number) {
  const start = new Date(startsAt).getTime();
  const end = start + graceMin * 60_000;
  if (nowMs < start) return { phase: "before" as const, pct: 0 };
  if (nowMs > end) return { phase: "after" as const, pct: 100 };
  return { phase: "during" as const, pct: Math.min(100, ((nowMs - start) / (end - start)) * 100) };
}

export function timingBadge(startsAt: string, graceMin: number, nowMs: number) {
  const min = minutesUntilStart(startsAt, nowMs);
  if (min > 60) return { label: `In ${Math.floor(min / 60)} hr ${min % 60} min`, tone: "muted" as const };
  if (min > 5) return { label: `Due in ${min} min`, tone: "due" as const };
  if (min >= 0) return { label: min === 0 ? "Due now" : `Due in ${min} min`, tone: "due" as const };
  const late = Math.abs(min);
  if (late <= graceMin) return { label: `${late} min late`, tone: "late" as const };
  return { label: "Grace ended", tone: "ended" as const };
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function formatSeatedDuration(openedAt: string, nowMs: number) {
  const mins = Math.max(0, Math.floor((nowMs - new Date(openedAt).getTime()) / 60_000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${String(m).padStart(2, "0")} min` : `${h} hr`;
}

export function secondsAgoLabel(updatedAtMs: number, nowMs: number) {
  const s = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000));
  if (s < 8) return "just now";
  if (s < 60) return `${s} seconds ago`;
  return `${Math.floor(s / 60)} min ago`;
}
