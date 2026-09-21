"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildMonthGrid,
  isInRange,
  isRangeEnd,
  isRangeStart,
  monthLabel,
  shiftMonth,
  WEEKDAYS,
} from "@/lib/calendar";
import { toInputDate } from "@/lib/order-dates";

type Props = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  onComplete?: () => void;
};

export function DateRangeCalendar({ from, to, onChange, onComplete }: Props) {
  const today = toInputDate();
  const [view, setView] = useState(() => {
    const base = from || today;
    const [y, m] = base.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [anchor, setAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (from) {
      const [y, m] = from.split("-").map(Number);
      setView(new Date(y, m - 1, 1));
    }
  }, [from]);

  const cells = buildMonthGrid(view);

  function onDayClick(date: string) {
    if (date > today) return;

    if (!anchor) {
      setAnchor(date);
      onChange(date, date);
      return;
    }

    const [start, end] = anchor <= date ? [anchor, date] : [date, anchor];
    onChange(start, end);
    setAnchor(null);
    onComplete?.();
  }

  function goToday() {
    const t = toInputDate();
    onChange(t, t);
    setAnchor(null);
    setView(new Date());
    onComplete?.();
  }

  function clearRange() {
    const t = toInputDate();
    onChange(t, t);
    setAnchor(null);
  }

  return (
    <div className="w-[300px] p-1">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => shiftMonth(v, -1))}
          className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-stone-900">{monthLabel(view)}</p>
        <button
          type="button"
          onClick={() => setView((v) => shiftMonth(v, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell.date || !cell.day) {
            return <div key={`empty-${i}`} className="h-9" />;
          }

          const disabled = cell.date > today;
          const inRange = isInRange(cell.date, from, to);
          const isStart = isRangeStart(cell.date, from, to);
          const isEnd = isRangeEnd(cell.date, from, to);
          const isToday = cell.date === today;
          const isAnchor = cell.date === anchor;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(cell.date!)}
              className={`h-9 rounded-lg text-xs font-semibold transition ${
                disabled
                  ? "cursor-not-allowed text-stone-300"
                  : isStart || isEnd || isAnchor
                    ? "bg-brand-600 text-white shadow-sm"
                    : inRange
                      ? "bg-brand-50 text-brand-800"
                      : isToday
                        ? "bg-stone-100 text-brand-700 ring-2 ring-brand-200 ring-inset"
                        : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
        <button
          type="button"
          onClick={clearRange}
          className="text-xs font-semibold text-stone-500 transition hover:text-stone-800"
        >
          Clear
        </button>
        <p className="text-[11px] text-stone-400">
          {anchor ? "Pick end date" : "Tap twice for range"}
        </p>
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          Today
        </button>
      </div>
    </div>
  );
}
