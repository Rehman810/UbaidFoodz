import { Star } from "lucide-react";
import { Reveal } from "./Reveal";

const REVIEWS = [
  {
    name: "Ayesha K.",
    area: "DHA Phase 6",
    text: "The zinger arrived still crunchy. Ubaid’s biryani portion is generous — my family orders every Friday.",
    dish: "Ubaid Zinger Burger",
  },
  {
    name: "Hassan R.",
    area: "North Nazimabad",
    text: "Broast quarter with the BBQ glaze is unreal. Rider called before the gate — proper service.",
    dish: "BBQ Broast Quarter",
  },
  {
    name: "Sara M.",
    area: "Clifton",
    text: "Ordered at midnight, got it in 38 minutes. Lava cake was warm. Will order again.",
    dish: "Molten Lava Cake",
  },
];

export function Reviews() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Karachi speaks</p>
          <h2 className="font-display mt-2 text-4xl sm:text-5xl">What people are saying</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={i * 100}>
              <blockquote className="flex h-full flex-col rounded-3xl border border-orange-100 bg-[#fffaf5] p-6">
                <div className="flex gap-0.5 text-brand-500">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">&ldquo;{r.text}&rdquo;</p>
                <footer className="mt-5 border-t border-orange-100 pt-4">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-stone-500">{r.area} · ordered {r.dish}</p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
