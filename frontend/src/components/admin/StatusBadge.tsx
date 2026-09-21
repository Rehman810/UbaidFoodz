import { OrderStatus, STATUS_LABEL } from "@/lib/types";
import { STATUS_THEME } from "@/lib/admin-status";

export function StatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "md" }) {
  const t = STATUS_THEME[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${t.bg} ${t.text} ${t.ring} ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
