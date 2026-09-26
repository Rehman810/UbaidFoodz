type Variant = "badge" | "inline" | "minimal";

type Props = {
  className?: string;
  variant?: Variant;
};

export function PoweredByDevsora({ className = "", variant = "badge" }: Props) {
  const link = (
    <a
      href="https://www.devsora.pro/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold transition-colors"
    >
      Devsora
    </a>
  );

  if (variant === "minimal") {
    return (
      <span className={`text-[10px] text-stone-400 ${className}`}>
        <span className="opacity-70">by </span>
        {link}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={`text-[11px] text-stone-500 ${className}`}>
        <span className="opacity-80">Powered by </span>
        {link}
      </span>
    );
  }

  return (
    <a
      href="https://www.devsora.pro/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] text-stone-400 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.07] hover:text-stone-300 ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-brand-500/80" aria-hidden />
      <span>
        Powered by <span className="font-semibold text-stone-300">Devsora</span>
      </span>
    </a>
  );
}
