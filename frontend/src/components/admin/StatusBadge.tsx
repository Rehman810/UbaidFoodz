import { OrderStatus, STATUS_LABEL } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  PREPARING: "bg-blue-100 text-blue-800 ring-blue-200",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800 ring-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
