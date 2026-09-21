"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";

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
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <h2 className="font-display text-center text-4xl sm:text-5xl">Questions?</h2>
          <p className="mt-2 text-center text-stone-500">Quick answers before you order.</p>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  {f.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-brand-600 transition ${open === i ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-stone-600">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
