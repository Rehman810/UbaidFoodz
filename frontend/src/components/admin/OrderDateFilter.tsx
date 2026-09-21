"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown } from "lucide-react";
import { formatDateSpanLabel, QuickDatePreset, quickPresetRange } from "@/lib/order-dates";
import { DateRangeCalendar } from "./DateRangeCalendar";

const QUICK: { id: QuickDatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

type Props = {
  from: string;
  to: string;
  activePreset: QuickDatePreset | null;
  onChange: (from: string, to: string, preset: QuickDatePreset | null) => void;
  orderCount: number;
};

export function OrderDateFilter({ from, to, activePreset, onChange, orderCount }: Props) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setDraftFrom(from);
      setDraftTo(to);
    }
  }, [from, to, open]);

  function updateMenuPosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 320;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    setMenuRect({ top: rect.bottom + 8, left: Math.max(16, left) });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-date-picker-menu]")) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function onReposition() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  function applyPreset(preset: QuickDatePreset) {
    const range = quickPresetRange(preset);
    onChange(range.from, range.to, preset);
    setOpen(false);
  }

  function applyDraft() {
    onChange(draftFrom, draftTo, null);
    setOpen(false);
  }

  function handleDraftChange(f: string, t: string) {
    setDraftFrom(f);
    setDraftTo(t);
  }

  const popover =
    open && menuRect
      ? (
          <div
            data-date-picker-menu
            style={{ position: "fixed", top: menuRect.top, left: menuRect.left, zIndex: 9999 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-3 shadow-2xl shadow-stone-900/15 ring-1 ring-stone-900/5"
          >
            <DateRangeCalendar
              from={draftFrom}
              to={draftTo}
              onChange={handleDraftChange}
              onComplete={applyDraft}
            />
            <button
              type="button"
              onClick={applyDraft}
              className="mt-2 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              Apply
            </button>
          </div>
        )
      : null;

  return (
    <div
      ref={rootRef}
      className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Calendar size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">Date filter</p>
          <p className="text-xs text-stone-500">
            <span className="font-semibold text-stone-700">{orderCount}</span> orders in period
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => applyPreset(q.id)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold ring-1 transition ${
              activePreset === q.id
                ? "bg-brand-600 text-white ring-brand-600"
                : "bg-stone-50 text-stone-600 ring-stone-200 hover:bg-stone-100"
            }`}
          >
            {q.label}
          </button>
        ))}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex min-w-[200px] items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            open
              ? "border-brand-400 ring-2 ring-brand-100"
              : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <span className="flex items-center gap-2 text-stone-800">
            <Calendar size={15} className="text-brand-600" />
            {formatDateSpanLabel(from, to)}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {typeof document !== "undefined" && popover && createPortal(popover, document.body)}
    </div>
  );
}
