"use client";

import { Download, MapPin, Phone, User } from "lucide-react";
import { downloadInvoice } from "@/lib/api";
import { formatWhen, pkr } from "@/lib/format";
import { Rider } from "@/lib/admin-types";
import { Order, OrderStatus, STATUS_LABEL } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AdminSelect } from "./AdminSelect";

export function OrderPanel({
  order,
  riders,
  onStatus,
  onAssign,
  compact,
}: {
  order: Order;
  riders: Rider[];
  onStatus: (id: string, status: OrderStatus) => void;
  onAssign: (id: string, riderId: string) => void;
  compact?: boolean;
}) {
  const showRider = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <article className={`rounded-2xl border border-stone-200 bg-white ${compact ? "p-4" : "p-5"} shadow-sm`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-stone-900">{order.orderNumber}</p>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-stone-400">{formatWhen(order.createdAt)}</p>
        </div>
        <p className="text-xl font-bold text-brand-700">{pkr(order.total)}</p>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-stone-600">
        <p className="flex items-center gap-2">
          <User size={14} className="shrink-0 text-stone-400" />
          {order.customerName}
        </p>
        <p className="flex items-center gap-2">
          <Phone size={14} className="shrink-0 text-stone-400" />
          <a href={`tel:${order.customerPhone}`} className="hover:text-brand-700">{order.customerPhone}</a>
        </p>
        <p className="flex items-start gap-2">
          <MapPin size={14} className="mt-0.5 shrink-0 text-stone-400" />
          <span className="line-clamp-2">{order.deliveryAddress}</span>
        </p>
      </div>

      {!compact && (
        <ul className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2 py-0.5">
              <span>{i.quantity}× {i.nameAtOrder}</span>
              <span className="text-stone-500">{pkr(Number(i.priceAtOrder) * i.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      {order.notes && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Note: {order.notes}
        </p>
      )}

      {order.rider && (
        <p className="mt-2 text-xs font-medium text-violet-700">
          Rider: {order.rider.name} · {order.rider.phone}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        <AdminSelect
          value={order.status}
          aria-label="Order status"
          options={Object.entries(STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
          onChange={(v) => onStatus(order.id, v as OrderStatus)}
        />

        {showRider && (
          <AdminSelect
            value={order.riderId || ""}
            aria-label="Assign rider"
            minWidth="min-w-[160px]"
            placeholder="Assign rider"
            options={riders.map((r) => ({ value: r.id, label: r.name }))}
            onChange={(v) => v && onAssign(order.id, v)}
          />
        )}

        {(order.status === "DELIVERED" || order.invoice) && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-semibold text-stone-700 shadow-sm hover:border-brand-300 hover:bg-brand-50"
            onClick={() => downloadInvoice(order.id)}
          >
            <Download size={14} /> Invoice
          </button>
        )}
      </div>
    </article>
  );
}
