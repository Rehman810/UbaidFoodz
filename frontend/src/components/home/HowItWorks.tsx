import { Bike, UtensilsCrossed, Zap } from "lucide-react";

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Build your bag",
    text: "Tap + to quick-add or open a dish to pick size, addons and notes.",
  },
  {
    icon: Zap,
    title: "Kitchen fires up",
    text: "Fresh prep starts right away. Follow status from pending to on the way.",
  },
  {
    icon: Bike,
    title: "Hot at your door",
    text: "Cash on delivery across Karachi. Rider calls if they need gate help.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[#fffaf5] py-16 sm:py-24">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-600">Simple as 1 · 2 · 3</p>
          <h2 className="font-display mt-3 text-3xl text-stone-900 sm:text-5xl">How ordering works</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-stone-600 sm:text-base">
            From craving to doorstep in three easy steps — no account needed to start.
          </p>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-14 hidden h-0.5 bg-gradient-to-r from-transparent via-brand-300 to-transparent md:block"
            aria-hidden
          />

          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-white/80 bg-white p-6 shadow-[0_8px_30px_rgba(28,25,23,0.06)] transition hover:-translate-y-0.5 hover:shadow-card sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-600/25">
                  <s.icon size={22} strokeWidth={2.2} />
                </span>
                <span className="font-display text-3xl font-bold text-brand-100 transition group-hover:text-brand-200">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
