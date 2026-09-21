import { LucideIcon } from "lucide-react";

const ACCENTS = {
  brand: {
    icon: "bg-white/20 text-white",
    card: "from-brand-600 via-brand-600 to-orange-600 border-brand-500/30",
    glow: "shadow-[0_20px_50px_-20px_rgba(234,88,12,0.55)]",
    value: "text-white",
    label: "text-orange-100",
    sub: "bg-white/20 text-white",
    dark: true,
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-600",
    card: "from-white to-emerald-50/80 border-emerald-100",
    glow: "shadow-sm",
    value: "text-stone-900",
    label: "text-stone-500",
    sub: "bg-emerald-100 text-emerald-700",
    dark: false,
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600",
    card: "from-white to-amber-50/80 border-amber-100",
    glow: "shadow-sm",
    value: "text-stone-900",
    label: "text-stone-500",
    sub: "bg-amber-100 text-amber-700",
    dark: false,
  },
  violet: {
    icon: "bg-violet-500/15 text-violet-600",
    card: "from-white to-violet-50/80 border-violet-100",
    glow: "shadow-sm",
    value: "text-stone-900",
    label: "text-stone-500",
    sub: "bg-violet-100 text-violet-700",
    dark: false,
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-600",
    card: "from-white to-blue-50/80 border-blue-100",
    glow: "shadow-sm",
    value: "text-stone-900",
    label: "text-stone-500",
    sub: "bg-blue-100 text-blue-700",
    dark: false,
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "brand",
  featured,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENTS;
  featured?: boolean;
}) {
  const a = ACCENTS[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition hover:-translate-y-0.5 ${a.card} ${a.glow} ${
        featured ? "sm:col-span-2 lg:row-span-2 sm:p-6" : ""
      }`}
    >
      {a.dark && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${a.icon}`}>
          <Icon size={featured ? 22 : 18} />
        </div>
        {sub && (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.sub}`}>
            {sub}
          </span>
        )}
      </div>
      <p className={`relative mt-4 font-bold tracking-tight ${a.value} ${featured ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
        {value}
      </p>
      <p className={`relative mt-1 text-sm font-medium ${a.label}`}>{label}</p>
    </div>
  );
}
