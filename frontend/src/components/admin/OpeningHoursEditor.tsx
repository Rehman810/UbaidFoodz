"use client";

import { Clock, Moon, Sun } from "lucide-react";
import {
  DayPeriod,
  formatTime12,
  from12HourParts,
  isStoreOpen,
  storeHoursLabel,
  storeStatusLabel,
  to12HourParts,
} from "@/lib/store-hours";
import { StoreSettings } from "@/lib/types";

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

type OpeningHoursEditorProps = {
  settings: StoreSettings;
  onChange: (patch: Partial<StoreSettings>) => void;
};

function TimeRow({
  label,
  icon: Icon,
  hour24,
  minute,
  onChange,
}: {
  label: string;
  icon: typeof Sun;
  hour24: number;
  minute: number;
  onChange: (hour24: number, minute: number) => void;
}) {
  const { hour12, period } = to12HourParts(hour24, minute);

  function update(h12: number, m: number, p: DayPeriod) {
    const safeHour = Math.min(12, Math.max(1, h12));
    const safeMinute = Math.min(59, Math.max(0, m));
    const next = from12HourParts(safeHour, safeMinute, p);
    onChange(next.hour, next.minute);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-orange-100">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-stone-800">{label}</p>
          <p className="text-lg font-bold text-stone-900">{formatTime12(hour24, minute)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="flex items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
          <select
            aria-label={`${label} hour`}
            className="h-10 w-14 appearance-none bg-transparent pl-3 pr-1 text-center text-sm font-bold text-stone-900 outline-none"
            value={hour12}
            onChange={(e) => update(Number(e.target.value), minute, period)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="px-0.5 font-bold text-stone-400">:</span>
          <select
            aria-label={`${label} minute`}
            className="h-10 w-14 appearance-none bg-transparent pl-1 pr-3 text-center text-sm font-bold text-stone-900 outline-none"
            value={minute - (minute % 5)}
            onChange={(e) => update(hour12, Number(e.target.value), period)}
          >
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
          {(["AM", "PM"] as DayPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => update(hour12, minute, p)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                period === p
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OpeningHoursEditor({ settings, onChange }: OpeningHoursEditorProps) {
  const open = isStoreOpen(settings);
  const hours = storeHoursLabel(
    settings.openHour,
    settings.openMinute,
    settings.closeHour,
    settings.closeMinute
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-[#fffaf5] to-white">
      <div className="flex items-center gap-2 border-b border-orange-100 px-4 py-3">
        <Clock size={16} className="text-brand-600" />
        <p className="text-sm font-semibold text-stone-800">Daily schedule</p>
        <span className="ml-auto text-xs text-stone-500">Asia/Karachi</span>
      </div>

      <div className="space-y-4 p-4">
        <TimeRow
          label="Opens"
          icon={Sun}
          hour24={settings.openHour}
          minute={settings.openMinute}
          onChange={(hour, minute) => onChange({ openHour: hour, openMinute: minute })}
        />

        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-orange-100" />
          <span className="relative rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 ring-1 ring-orange-100">
            until
          </span>
        </div>

        <TimeRow
          label="Closes"
          icon={Moon}
          hour24={settings.closeHour}
          minute={settings.closeMinute}
          onChange={(hour, minute) => onChange({ closeHour: hour, closeMinute: minute })}
        />
      </div>

      <div
        className={`border-t px-4 py-3 ${
          open
            ? "border-emerald-100 bg-emerald-50/80"
            : "border-amber-100 bg-amber-50/80"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              open ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-amber-500"}`} />
            {open ? "Open now" : "Closed now"}
          </span>
          <span className="text-sm font-semibold text-stone-800">{hours}</span>
        </div>
        <p className="mt-1 text-xs text-stone-600">{storeStatusLabel(settings)}</p>
      </div>
    </div>
  );
}
