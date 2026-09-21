import { Bike, UtensilsCrossed, Zap } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Browse & build your bag",
    text: "Starters, mains, drinks — add what you want.",
  },
  {
    icon: Zap,
    title: "Kitchen fires up",
    text: "We prep fresh. Track from Pending to Out for delivery.",
  },
  {
    icon: Bike,
    title: "Rider at your door",
    text: "Cash on delivery. Call if you need gate directions.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-orange-100 bg-stone-950 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">Simple as 1-2-3</p>
          <h2 className="font-display mt-1.5 text-3xl sm:text-5xl">How ordering works</h2>
        </Reveal>

        {/* Mobile: compact timeline */}
        <ol className="relative mt-8 space-y-0 md:hidden">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <li className="relative flex gap-4 pb-6 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-[22px] top-12 h-[calc(100%-12px)] w-0.5 bg-gradient-to-b from-brand-500 to-brand-800"
                    aria-hidden
                  />
                )}
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/50">
                  <s.icon size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-0.5 font-display text-lg leading-snug">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-400">{s.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>

        {/* Desktop: 3-column cards */}
        <div className="mt-10 hidden gap-5 md:grid md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-brand-500/40 hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
                    <s.icon size={22} strokeWidth={2.2} />
                  </span>
                  <span className="font-display text-3xl font-bold text-brand-500/50">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
