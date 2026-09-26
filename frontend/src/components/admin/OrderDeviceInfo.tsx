"use client";

import { ExternalLink, Globe, MapPin } from "lucide-react";
import { mapsLink } from "@/lib/geolocation";
import { Order } from "@/lib/types";

function orderCoords(order: Order) {
  const lat = order.customerLatitude != null ? Number(order.customerLatitude) : null;
  const lng = order.customerLongitude != null ? Number(order.customerLongitude) : null;
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
  const accuracy =
    order.customerLocationAccuracy != null ? Number(order.customerLocationAccuracy) : null;
  return { lat, lng, hasCoords, accuracy };
}

/** Compact IP + map link for the orders table. */
export function OrderDeviceCell({ order }: { order: Order }) {
  const { lat, lng, hasCoords, accuracy } = orderCoords(order);

  if (!order.customerIp && !hasCoords) {
    return <span className="text-xs text-stone-400">—</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      {order.customerIp && <p className="font-mono text-stone-600">{order.customerIp}</p>}
      {hasCoords && (
        <a
          href={mapsLink(lat!, lng!)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin size={11} />
          {lat!.toFixed(4)}, {lng!.toFixed(4)}
          {accuracy != null && Number.isFinite(accuracy) ? (
            <span className="font-normal text-stone-400">±{Math.round(accuracy)}m</span>
          ) : null}
        </a>
      )}
    </div>
  );
}

export function OrderDeviceInfo({ order }: { order: Order }) {
  const { lat, lng, hasCoords, accuracy } = orderCoords(order);

  if (!order.customerIp && !hasCoords) return null;

  return (
    <section className="mt-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-800">Device & location</h3>
      <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-stone-50/50">
        {order.customerIp && (
          <div className="flex gap-3 px-4 py-3">
            <Globe size={16} className="mt-0.5 shrink-0 text-stone-400" />
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-stone-400">IP address</dt>
              <dd className="mt-0.5 font-mono text-sm text-stone-800">{order.customerIp}</dd>
            </div>
          </div>
        )}
        {hasCoords && (
          <div className="flex gap-3 px-4 py-3">
            <MapPin size={16} className="mt-0.5 shrink-0 text-stone-400" />
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-stone-400">GPS at order time</dt>
              <dd className="mt-0.5 text-sm text-stone-800">
                {lat!.toFixed(5)}, {lng!.toFixed(5)}
                {accuracy != null && Number.isFinite(accuracy) ? (
                  <span className="text-stone-500"> · ±{Math.round(accuracy)} m</span>
                ) : null}
              </dd>
              <a
                href={mapsLink(lat!, lng!)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                Open in Google Maps <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
}
