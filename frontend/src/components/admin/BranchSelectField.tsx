"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";

export type BranchSelectOption = {
  id: string;
  name: string;
  address?: string;
};

export function BranchSelectField({
  value,
  onChange,
  branches,
  disabled,
  placeholder = "Select a branch",
}: {
  value: string;
  onChange: (branchId: string) => void;
  branches: BranchSelectOption[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = branches.find((b) => b.id === value);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name="branchId" value={value} required={branches.length > 0} readOnly />

      <button
        type="button"
        id={listId}
        disabled={disabled || branches.length === 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={listId}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-600 dark:bg-stone-900/40 dark:hover:border-stone-500"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-inner"
        >
          <Building2 size={18} strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
            {selected?.name ?? (branches.length === 0 ? "No branches" : placeholder)}
          </span>
          <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
            {selected?.address?.trim() || "Restaurant outlet"}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-stone-400 transition group-hover:text-stone-600 dark:group-hover:text-stone-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && branches.length > 0 && (
        <div
          role="listbox"
          aria-label="Select branch"
          className="absolute left-0 right-0 z-[120] mt-2 max-h-56 overflow-y-auto rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-xl shadow-stone-900/10 dark:border-stone-600 dark:bg-stone-900 dark:shadow-black/50"
        >
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Choose outlet
          </p>
          {branches.map((b) => {
            const isSelected = b.id === value;
            return (
              <button
                key={b.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(b.id);
                  close();
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-brand-50 text-brand-900 dark:bg-brand-950/60 dark:text-brand-100"
                    : "text-stone-700 hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700 dark:from-stone-800 dark:to-stone-700 dark:text-stone-200">
                  <Building2 size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{b.name}</span>
                  <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                    {b.address?.trim() || "Branch outlet"}
                  </span>
                </span>
                {isSelected && <Check size={18} className="shrink-0 text-brand-600 dark:text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
