"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type AdminSelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  className?: string;
  minWidth?: string;
  "aria-label"?: string;
};

export function AdminSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
  minWidth = "min-w-[148px]",
  "aria-label": ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${minWidth} ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white py-2.5 pl-3 pr-2.5 text-left text-xs font-semibold shadow-sm outline-none transition ${
          open
            ? "border-brand-400 ring-2 ring-brand-100"
            : "border-stone-200 hover:border-brand-300"
        } ${selected ? "text-stone-800" : "text-stone-400"}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl shadow-stone-900/10 ring-1 ring-stone-900/5"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__empty"} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    active
                      ? "bg-brand-50 text-brand-800"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check size={14} className="shrink-0 text-brand-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
