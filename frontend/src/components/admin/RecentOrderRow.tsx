"use client";

import { pkr, formatWhen } from "@/lib/format";
import { Rider } from "@/lib/admin-types";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AdminSelect } from "./AdminSelect";

export function RecentOrderRow({
  order,
  riders,
  onStatus,
  onAssign,
}: {
  order: Order;
  riders: Rider[];
  onStatus: (id: string, s: OrderStatus) => void;
  onAssign: (id: string, riderId: string) => void;
}) {
  const showRider = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <div className="relative overflow-visible rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        {/* Left: order info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-stone-900">{order.orderNumber}</p>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.customerName} · {order.items.length} items
          </p>
          <p className="text-xs text-stone-400">{formatWhen(order.createdAt)}</p>
        </div>

        {/* Right: price + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:shrink-0">
          <p className="text-xl font-bold text-brand-700 sm:min-w-[100px] sm:text-right">{pkr(order.total)}</p>

          <div className="flex flex-wrap items-center gap-2">
            <AdminSelect
              value={order.status}
              aria-label="Order status"
              minWidth="min-w-[160px]"
              options={Object.entries(STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
              onChange={(v) => onStatus(order.id, v as OrderStatus)}
            />

            {showRider && (
              <AdminSelect
                value={order.riderId || ""}
                aria-label="Assign rider"
                minWidth="min-w-[130px]"
                placeholder="Assign rider"
                options={riders.map((r) => ({ value: r.id, label: r.name }))}
                onChange={(v) => v && onAssign(order.id, v)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
