export function pkr(n: string | number) {
  const v = typeof n === "string" ? Number(n) : n;
  return `Rs ${v.toLocaleString("en-PK")}`;
}

export function eta(createdAt: string) {
  const start = new Date(createdAt).getTime();
  const min = new Date(start + 30 * 60_000);
  const max = new Date(start + 45 * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  return `${fmt(min)} – ${fmt(max)}`;
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatElapsed(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return formatWhen(iso);
}
