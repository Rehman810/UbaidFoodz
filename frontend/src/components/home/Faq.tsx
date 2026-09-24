"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ = [
  {
    q: "How long does delivery take?",
    a: "Most orders land in 30–45 minutes depending on your area and kitchen load. You can track status live after placing an order.",
  },
  {
    q: "Do you accept card payments?",
    a: "This demo runs on cash on delivery only — pay the rider when your bag arrives. A real deployment would add JazzCash/EasyPaisa.",
  },
  {
    q: "Which areas do you cover?",
    a: "We deliver across DHA, Clifton, PECHS, Gulshan, North Nazimabad, Bahria Town, Malir Cantt and more across Karachi.",
  },
  {
    q: "Can I customise my order?",
    a: "Add notes at checkout — extra raita, no onions, spice level. The kitchen reads every note before the bag leaves.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

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
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition ${
                  isOpen ? "border-brand-200 bg-[#fffaf5] shadow-sm" : "border-orange-100 bg-white"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="font-semibold text-stone-900">{f.q}</span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                      isOpen ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    <ChevronDown size={16} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-stone-600 sm:px-6">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
