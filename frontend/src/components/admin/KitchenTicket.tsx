"use client";

import { ArrowRight, ChefHat, Check, Package, StickyNote } from "lucide-react";
import { FulfillmentBadge } from "@/components/FulfillmentBadge";
import { STATUS_THEME } from "@/lib/admin-status";
import { formatElapsed } from "@/lib/format";
import { Order } from "@/lib/types";

export function KitchenTicket({
  order,
  actionLabel,
  onAction,
  busy,
  error,
}: {
  order: Order;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
  error?: string;
}) {
  const theme = STATUS_THEME[order.status];
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <article className={`relative overflow-hidden rounded-xl border bg-white shadow-sm ${theme.border}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${theme.stripe}`} />

      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">{order.orderNumber}</p>
            <div className="mt-1">
              <FulfillmentBadge type={order.fulfillmentType} />
            </div>
          </div>
          <p className="inline-flex shrink-0 items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {formatElapsed(order.createdAt)}
          </p>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-stone-600">
          <Package size={12} className="shrink-0 text-stone-400" />
          <span className="truncate font-medium">{order.customerName}</span>
          <span className="text-stone-300">·</span>
          <span className="shrink-0 text-stone-500">{itemCount} items</span>
        </div>

        <ul className="mt-2.5 space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="text-xs leading-snug text-stone-700">
              <span className="font-semibold text-stone-900">{item.quantity}×</span> {item.nameAtOrder}
              {item.optionsLabel ? <span className="text-stone-500"> · {item.optionsLabel}</span> : null}
              {item.instructions ? (
                <span className="block pl-4 text-[11px] italic text-stone-500">{item.instructions}</span>
              ) : null}
            </li>
          ))}
        </ul>

        {order.notes && (
          <p className="mt-2 flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 ring-1 ring-amber-100">
            <StickyNote size={12} className="mt-0.5 shrink-0 text-amber-600" />
            {order.notes}
          </p>
        )}

        {error && <p className="mt-2 text-[11px] font-medium text-rose-600">{error}</p>}

        {onAction && actionLabel ? (
          <button
            type="button"
            disabled={busy}
            onClick={onAction}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-stone-900 py-2 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {order.status === "PENDING" ? <ChefHat size={13} /> : <Check size={13} />}
            {busy ? "Updating…" : actionLabel}
            <ArrowRight size={13} />
          </button>
        ) : null}
      </div>
    </article>
  );
}
