"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export function Faq() {
  const store = useStore();
  const [open, setOpen] = useState(0);
  const city = store?.settings.city?.trim();
  const eta = store?.settings.deliveryEstimateMin ?? 45;
  const areas = store?.areaCount ?? 0;
  const cash = store?.settings.acceptCash !== false;
  const card = store?.settings.acceptCard !== false;

  const payments = [cash ? "cash on delivery" : null, card ? "card at the counter" : null].filter(Boolean).join(" and ");

  const items = [
    {
      q: "How long does delivery take?",
      a: `Most orders land in about ${eta} minutes depending on your area and kitchen load. You can track status live after placing an order.`,
    },
    {
      q: "Which payment methods do you accept?",
      a: payments
        ? `You can pay with ${payments}.`
        : "Ask the restaurant which payment methods are available.",
    },
    {
      q: "Which areas do you cover?",
      a: areas
        ? `We deliver to ${areas} area${areas === 1 ? "" : "s"}${city ? ` in ${city}` : ""}.`
        : city
          ? `Delivery areas in ${city} are listed at checkout.`
          : "Delivery areas are listed at checkout.",
    },
    {
      q: "Can I customise my order?",
      a: "Add notes at checkout — extra sauce, no onions, spice level. The kitchen reads every note before the bag leaves.",
    },
  ];

  return (
    <section className="bg-white py-16 pb-28 sm:py-24 sm:pb-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <HelpCircle size={22} />
          </span>
          <h2 className="font-display mt-4 text-3xl text-stone-900 sm:text-4xl">Questions before you order?</h2>
          <p className="mt-2 text-sm text-stone-500">Quick answers — no long reads.</p>
        </div>

        <div className="mt-10 space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-orange-100 bg-[#fffaf5]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-stone-900">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-stone-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-stone-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
