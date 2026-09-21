"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bike,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  Search,
  Store,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { pkr } from "@/lib/format";
import { PICKUP_LOCATION, useFulfillment } from "@/lib/fulfillment";
import { DeliveryArea } from "@/lib/types";

export function FulfillmentModal() {
  const {
    hasChosen,
    mode,
    areaId,
    openModal,
    setOpenModal,
    setDelivery,
    setPickup,
  } = useFulfillment();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"choose" | "areas">("choose");
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(areaId);
  const [visible, setVisible] = useState(false);

  const show = openModal || !hasChosen;

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(r);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    api<DeliveryArea[]>("/delivery-areas")
      .then(setAreas)
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));
  }, [show]);

  useEffect(() => {
    if (show) {
      setStep(hasChosen && mode === "DELIVERY" ? "areas" : "choose");
      setPickedId(areaId);
      setQuery("");
    }
  }, [show, hasChosen, mode, areaId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [areas, query]);

  const pickedArea = areas.find((a) => a.id === pickedId);

  if (!show) return null;

  function confirmDelivery() {
    const area = areas.find((a) => a.id === pickedId);
    if (!area) return;
    setDelivery(area.id, area.name, Number(area.deliveryCharge));
  }

  function closeIfAllowed() {
    if (hasChosen) setOpenModal(false);
  }

  const isChoose = step === "choose";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-stone-950/60 backdrop-blur-[6px] transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeIfAllowed}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delivery or pickup"
        className={`relative flex w-full flex-col overflow-hidden bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] transition-all duration-300 sm:shadow-[0_24px_80px_rgba(0,0,0,0.22)] ${
          isChoose
            ? "max-w-[360px] rounded-t-[22px] sm:rounded-[22px]"
            : "max-h-[75vh] max-w-[360px] rounded-t-[22px] sm:max-h-[min(80vh,620px)] sm:rounded-[22px]"
        } ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 sm:translate-y-3"}`}
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-brand-500 via-orange-400 to-amber-400" />

        <div className="relative shrink-0 px-5 pb-3 pt-5">
          {hasChosen && (
            <button
              type="button"
              onClick={closeIfAllowed}
              className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800"
            >
              <X size={15} />
            </button>
          )}

          {step === "areas" && (
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}

          <div className="pr-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">
              {isChoose ? "Welcome" : "Delivery area"}
            </p>
            <h2 className="font-display mt-1 text-xl leading-tight text-stone-900">
              {isChoose ? "How should we get your food to you?" : "Where in Karachi?"}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
              {isChoose
                ? "Choose delivery to your door or quick pickup from our kitchen."
                : `${areas.length} areas available · fee added at checkout`}
            </p>
          </div>
        </div>

        {isChoose ? (
          <div className="space-y-2.5 px-5 pb-5">
            <button
              type="button"
              onClick={() => setStep("areas")}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-orange-100 bg-gradient-to-br from-brand-50 to-orange-50/80 p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30 transition group-hover:scale-105">
                <Bike size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-stone-900">Delivery</p>
                <p className="mt-0.5 text-xs text-stone-600">To your area across Karachi</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                  <MapPin size={11} /> Select area & fee
                </p>
              </div>
              <ArrowRight
                size={17}
                className="shrink-0 text-brand-500 transition group-hover:translate-x-0.5"
              />
            </button>

            <button
              type="button"
              onClick={() => setPickup()}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-stone-200 bg-stone-50 p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-md active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-800 text-white shadow-md transition group-hover:scale-105">
                <Store size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-stone-900">Pickup</p>
                <p className="mt-0.5 text-xs text-stone-600">No delivery fee · ready in ~20 min</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500">
                  <Clock size={11} /> Clifton Block 5
                </p>
              </div>
              <ArrowRight
                size={17}
                className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5"
              />
            </button>

            <p className="pt-0.5 text-center text-[10px] leading-snug text-stone-400">
              Pickup: {PICKUP_LOCATION}
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 px-5 pb-2.5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  size={15}
                />
                <input
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Search Clifton, DHA, Gulshan…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-2">
              {loading && (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-12 rounded-xl" />
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="mx-1 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-8 text-center">
                  <MapPin className="mx-auto mb-2 text-stone-300" size={24} />
                  <p className="text-sm font-semibold text-stone-700">No areas found</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Try another search or choose pickup instead.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep("choose")}
                    className="btn-ghost mt-3 text-xs"
                  >
                    Back to options
                  </button>
                </div>
              )}

              <ul className="space-y-1 p-0.5">
                {filtered.map((area) => {
                  const active = pickedId === area.id;
                  return (
                    <li key={area.id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(area.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition ${
                          active
                            ? "border-brand-500 bg-brand-50 shadow-sm"
                            : "border-transparent bg-stone-50 hover:border-stone-200 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 transition ${
                            active
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {active && <Check size={10} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                          {area.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            active ? "bg-brand-600 text-white" : "bg-white text-brand-700 ring-1 ring-brand-100"
                          }`}
                        >
                          {pkr(area.deliveryCharge)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="shrink-0 border-t border-stone-100 bg-white p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {pickedArea && (
                <p className="mb-2 text-center text-[11px] text-stone-500">
                  Delivery to <strong className="text-stone-700">{pickedArea.name}</strong> ·{" "}
                  <strong className="text-brand-700">{pkr(pickedArea.deliveryCharge)}</strong> fee
                </p>
              )}
              <button
                type="button"
                className="btn-primary h-10 w-full text-sm"
                disabled={!pickedId}
                onClick={confirmDelivery}
              >
                Continue with delivery
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
