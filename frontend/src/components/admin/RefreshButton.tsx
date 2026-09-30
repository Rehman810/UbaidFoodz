"use client";

import { RefreshCw } from "lucide-react";

export function RefreshButton({
  busy,
  onClick,
  className = "",
  variant = "ghost",
}: {
  busy?: boolean;
  onClick: () => void;
  className?: string;
  variant?: "ghost" | "primary" | "dark";
}) {
  const styles = {
    ghost:
      "inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white disabled:opacity-60",
    primary:
      "inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-60",
    dark:
      "inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-brand-900/40 hover:bg-brand-500 disabled:opacity-60",
  };

  return (
    <button type="button" onClick={onClick} disabled={busy} className={`${styles[variant]} ${className}`}>
      <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
      Refresh
    </button>
  );
}
