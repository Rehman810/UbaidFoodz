"use client";

import { pkr, formatWhen } from "@/lib/format";
import { Rider } from "@/lib/admin-types";
import { STATUS_THEME } from "@/lib/admin-status";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";
import { FulfillmentBadge } from "@/components/FulfillmentBadge";
import { StatusBadge } from "./StatusBadge";
import { AdminSelect } from "./AdminSelect";

const STATUS_OPTIONS = Object.entries(STATUS_LABEL).map(([k, v]) => ({
  value: k,
  label: v,
  status: k as OrderStatus,
}));

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
  const showRider =
    order.fulfillmentType !== "PICKUP" &&
    order.status !== "DELIVERED" &&
    order.status !== "CANCELLED" &&
    order.status !== "AWAITING_CONFIRMATION";
  const theme = STATUS_THEME[order.status];

  return (
    <div
      className={`group relative overflow-visible rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.border}`}
    >
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${theme.stripe}`} />

      <div className="flex flex-col gap-3 pl-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-stone-900">{order.orderNumber}</p>
            <FulfillmentBadge type={order.fulfillmentType} />
            <StatusBadge status={order.status} fulfillmentType={order.fulfillmentType} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.customerName} · {order.items.length} items
          </p>
          <p className="text-xs text-stone-400">{formatWhen(order.createdAt)}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4 lg:shrink-0">
          <p className="font-display text-xl font-bold text-brand-700 sm:min-w-[100px] sm:text-right">{pkr(order.total)}</p>

          <div className="flex flex-wrap items-end gap-2">
            <AdminSelect
              value={order.status}
              label="Status"
              aria-label="Order status"
              minWidth="min-w-[160px]"
              options={STATUS_OPTIONS}
              onChange={(v) => onStatus(order.id, v as OrderStatus)}
            />

            {showRider && (
              <AdminSelect
                value={order.riderId || ""}
                label="Rider"
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
