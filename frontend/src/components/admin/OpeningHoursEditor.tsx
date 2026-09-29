"use client";

import { Clock } from "lucide-react";
import { WEEKDAYS, WeeklySchedule, coerceSchedule, type Weekday } from "@/lib/hours";
import { isStoreOpen, scheduleHoursLabel, storeStatusLabel } from "@/lib/store-hours";
import { StoreSettings } from "@/lib/types";

const LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

type OpeningHoursEditorProps = {
  settings: StoreSettings;
  onChange: (patch: Partial<StoreSettings>) => void;
};

function withLegacy(schedule: WeeklySchedule): Partial<StoreSettings> {
  const day = WEEKDAYS.map((key) => schedule[key]).find((row) => !row.closed && row.slots[0]);
  const slot = day?.slots[0] || { open: "09:00", close: "23:00" };
  const [openHour, openMinute] = slot.open.split(":").map(Number);
  const [closeHour, closeMinute] = slot.close.split(":").map(Number);
  return { weeklySchedule: schedule, openHour, openMinute, closeHour, closeMinute };
}

export function OpeningHoursEditor({ settings, onChange }: OpeningHoursEditorProps) {
  const schedule = coerceSchedule(settings.weeklySchedule, settings);
  const open = isStoreOpen(settings);

  function update(next: WeeklySchedule) {
    onChange(withLegacy(next));
  }

  function patchDay(day: Weekday, row: WeeklySchedule[Weekday]) {
    update({ ...schedule, [day]: row });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-[#fffaf5] to-white">
      <div className="flex items-center gap-2 border-b border-orange-100 px-4 py-3">
        <Clock size={16} className="text-brand-600" />
        <p className="text-sm font-semibold text-stone-800">Weekly schedule</p>
        <span className="ml-auto text-xs text-stone-500">{settings.timezone || "Restaurant timezone"}</span>
      </div>

      <div className="divide-y divide-orange-100">
        {WEEKDAYS.map((day) => {
          const row = schedule[day];
          return (
            <div key={day} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-stone-800">{LABELS[day]}</p>
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                  <input
                    type="checkbox"
                    checked={row.closed}
                    onChange={(e) =>
                      patchDay(day, {
                        closed: e.target.checked,
                        slots: e.target.checked ? [] : row.slots.length ? row.slots : [{ open: "09:00", close: "23:00" }],
                      })
                    }
                  />
                  Closed all day
                </label>
              </div>
              {!row.closed &&
                row.slots.map((slot, index) => (
                  <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                    <input
                      aria-label={`${LABELS[day]} opens`}
                      type="time"
                      className="input h-10 w-32"
                      value={slot.open}
                      onChange={(e) => {
                        const slots = row.slots.map((item, i) => (i === index ? { ...item, open: e.target.value } : item));
                        patchDay(day, { ...row, slots });
                      }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">until</span>
                    <input
                      aria-label={`${LABELS[day]} closes`}
                      type="time"
                      className="input h-10 w-32"
                      value={slot.close}
                      onChange={(e) => {
                        const slots = row.slots.map((item, i) => (i === index ? { ...item, close: e.target.value } : item));
                        patchDay(day, { ...row, slots });
                      }}
                    />
                    {row.slots.length > 1 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-stone-500 hover:text-rose-700"
                        onClick={() => patchDay(day, { ...row, slots: row.slots.filter((_, i) => i !== index) })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              {!row.closed && row.slots.length < 3 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-700"
                  onClick={() => patchDay(day, { ...row, slots: [...row.slots, { open: "19:00", close: "23:00" }] })}
                >
                  Add slot
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={`border-t px-4 py-3 ${open ? "border-emerald-100 bg-emerald-50/80" : "border-amber-100 bg-amber-50/80"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-amber-500"}`} />
            {open ? "Open now" : "Closed now"}
          </span>
          <span className="text-sm font-semibold text-stone-800">{scheduleHoursLabel(settings)}</span>
        </div>
        <p className="mt-1 text-xs text-stone-600">{storeStatusLabel(settings)}</p>
      </div>
    </div>
  );
}
