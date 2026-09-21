const ITEMS = [
  "Karachi Biryani",
  "Zinger Burger",
  "BBQ Broast",
  "Chicken Tikka",
  "Masala Fries",
  "Mango Lassi",
  "Lava Cake",
  "Dynamite Prawns",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-orange-200/60 bg-brand-900 py-3">
      <div className="marquee-track flex w-max gap-10 px-4 text-sm font-semibold uppercase tracking-[0.2em] text-orange-100">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-10">
            {item}
            <span className="text-brand-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
