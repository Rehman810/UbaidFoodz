import { Quote, Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Ayesha Khan",
    area: "DHA Phase 6",
    text: "The zinger arrived still crunchy. Biryani portions are generous — we order every Friday night.",
    dish: "Ubaid Zinger Burger",
    initial: "AK",
    rating: 5,
  },
  {
    name: "Hassan Raza",
    area: "North Nazimabad",
    text: "Broast quarter with BBQ glaze is unreal. Rider called before the gate — proper Karachi service.",
    dish: "BBQ Broast Quarter",
    initial: "HR",
    rating: 5,
  },
  {
    name: "Sara Malik",
    area: "Clifton",
    text: "Ordered at midnight, food landed in 38 minutes. Lava cake was still warm. Already reordered.",
    dish: "Molten Lava Cake",
    initial: "SM",
    rating: 5,
  },
];

export function Reviews() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-600">Karachi speaks</p>
            <h2 className="font-display mt-3 text-3xl text-stone-900 sm:text-5xl">Loved by locals</h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3">
            <div className="flex gap-0.5 text-brand-500">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={14} fill="currentColor" />
              ))}
            </div>
            <div className="text-sm">
              <p className="font-bold text-stone-900">4.8</p>
              <p className="text-xs text-stone-500">2,400+ orders</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <blockquote
              key={r.name}
              className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-orange-100/80 bg-gradient-to-b from-[#fffaf5] to-white p-6 shadow-sm ${
                i === 1 ? "lg:-mt-2 lg:shadow-card" : ""
              }`}
            >
              <Quote size={28} className="text-brand-200" strokeWidth={1.5} />
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-stone-700">{r.text}</p>

              <div className="mt-6 flex items-center gap-3 border-t border-orange-100 pt-5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {r.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">{r.name}</p>
                  <p className="text-xs text-stone-500">{r.area}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-brand-700">Ordered · {r.dish}</p>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
