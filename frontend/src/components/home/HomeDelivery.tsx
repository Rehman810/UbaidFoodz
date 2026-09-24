"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone, Truck } from "lucide-react";
import { useStore } from "@/lib/store";

export function HomeDelivery({ zones }: { zones: string[] }) {
  const store = useStore();
  const deliveryMin = store?.settings.deliveryEstimateMin ?? 45;

  return (
    <section className="bg-[#fffaf5] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-600">Karachi-wide</p>
          <h2 className="font-display mt-3 text-3xl text-stone-900 sm:text-5xl">We ride to your door</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-stone-600 sm:text-base">
            Hot bags, live tracking, and riders who know your streets.
          </p>
        </div>

        {/* Quick stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { icon: MapPin, label: `${zones.length || "40"}+ areas` },
            { icon: Clock, label: `~${deliveryMin} min delivery` },
            { icon: Truck, label: "Cash on delivery" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm"
            >
              <Icon size={14} className="text-brand-600" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-5 lg:gap-6">
          {/* Zones card */}
          <div className="rounded-3xl border border-orange-100/80 bg-white p-6 shadow-[0_8px_30px_rgba(28,25,23,0.06)] sm:p-8 lg:col-span-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <MapPin size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Delivery zones</p>
                <h3 className="font-display text-xl text-stone-900 sm:text-2xl">Across Karachi</h3>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(zones.length ? zones.slice(0, 18) : ["Loading areas…"]).map((z) => (
                <span
                  key={z}
                  className="rounded-full bg-[#fffaf5] px-3.5 py-1.5 text-xs font-medium text-stone-700 ring-1 ring-orange-100 transition hover:bg-brand-50 hover:ring-brand-200"
                >
                  {z}
                </span>
              ))}
              {zones.length > 18 && (
                <span className="rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200">
                  +{zones.length - 18} more
                </span>
              )}
            </div>
          </div>

          {/* Hours card */}
          <div className="flex flex-col rounded-3xl border border-orange-100/80 bg-white p-6 shadow-[0_8px_30px_rgba(28,25,23,0.06)] sm:p-8 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
                <Clock size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Kitchen hours</p>
                <h3 className="font-display text-xl text-stone-900">Open tonight</h3>
              </div>
            </div>

            <dl className="mt-6 flex-1 space-y-0 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-orange-50 py-3.5">
                <dt className="text-stone-500">Daily</dt>
                <dd className="font-semibold text-stone-900">{store?.hoursLabel ?? "7:00 PM – 2:30 AM"}</dd>
              </div>
              {store?.settings.freeDeliveryAbove != null && (
                <div className="flex items-center justify-between gap-4 border-b border-orange-50 py-3.5">
                  <dt className="text-stone-500">Free delivery</dt>
                  <dd className="font-semibold text-stone-900">
                    Rs {Number(store.settings.freeDeliveryAbove).toLocaleString("en-PK")}+
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="flex items-center gap-1.5 text-stone-500">
                  <Phone size={14} className="text-brand-500" /> Kitchen
                </dt>
                <dd className="font-semibold text-stone-900">{store?.settings.phone ?? "0321-5556677"}</dd>
              </div>
            </dl>

            <Link
              href="/menu"
              className="btn-primary mt-6 h-12 w-full text-sm shadow-float"
            >
              Start your order <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
