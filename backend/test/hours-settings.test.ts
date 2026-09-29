import { describe, expect, it } from "vitest";
import {
  coerceSchedule,
  defaultClosedMessage,
  hoursText,
  isKitchenOpen,
  isOpenAt,
  legacySchedule,
  type WeeklySchedule,
} from "../src/lib/hours";
import { quoteCharges } from "../src/lib/charges";
import { needsRestaurantName, paymentSummary, validateSettingsInput } from "../src/lib/settings-validate";

const tz = "Asia/Karachi";

function at(iso: string) {
  return new Date(iso);
}

function week(slot: { open: string; close: string }, closed: string[] = []): WeeklySchedule {
  const base = legacySchedule(9, 0, 23, 0);
  for (const day of Object.keys(base) as (keyof WeeklySchedule)[]) {
    base[day] = closed.includes(day) ? { closed: true, slots: [] } : { closed: false, slots: [{ ...slot }] };
  }
  return base;
}

describe("hours and settings", () => {
  it("[HRS-01] open-now for a same-day range", () => {
    const schedule = week({ open: "09:00", close: "23:00" });
    expect(isOpenAt(schedule, "mon", 10 * 60)).toBe(true);
    expect(isOpenAt(schedule, "mon", 9 * 60)).toBe(true);
    expect(isOpenAt(schedule, "mon", 8 * 60 + 59)).toBe(false);
    expect(isOpenAt(schedule, "mon", 23 * 60)).toBe(false);
    expect(isKitchenOpen({ forceClosed: false, timezone: tz, schedule }, at("2026-09-28T05:00:00.000Z"))).toBe(true);
  });

  it("[HRS-02] overnight range crosses midnight and respects boundaries", () => {
    const schedule = week({ open: "19:00", close: "02:30" });
    expect(isOpenAt(schedule, "mon", 23 * 60)).toBe(true);
    expect(isOpenAt(schedule, "tue", 1 * 60)).toBe(true);
    expect(isOpenAt(schedule, "tue", 3 * 60)).toBe(false);
    expect(isOpenAt(schedule, "mon", 19 * 60)).toBe(true);
    expect(isOpenAt(schedule, "tue", 2 * 60 + 30)).toBe(false);
  });

  it("[HRS-03] closed days and multiple slots", () => {
    const schedule = week({ open: "09:00", close: "23:00" }, ["sun"]);
    schedule.mon = { closed: false, slots: [{ open: "12:00", close: "15:00" }, { open: "19:00", close: "22:00" }] };
    expect(isOpenAt(schedule, "sun", 12 * 60)).toBe(false);
    expect(isOpenAt(schedule, "mon", 13 * 60)).toBe(true);
    expect(isOpenAt(schedule, "mon", 16 * 60)).toBe(false);
    expect(isOpenAt(schedule, "mon", 20 * 60)).toBe(true);
  });

  it("[HRS-04] force closed is never open", () => {
    const schedule = week({ open: "00:00", close: "23:59" });
    expect(isKitchenOpen({ forceClosed: true, timezone: tz, schedule }, at("2026-09-28T05:00:00.000Z"))).toBe(false);
  });

  it("[HRS-05] hours text and the default closed message come from the schedule", () => {
    const schedule = week({ open: "09:00", close: "23:00" });
    const text = hoursText(schedule);
    const message = defaultClosedMessage(schedule, tz, at("2026-09-28T02:00:00.000Z"));
    expect(text).toContain("9:00 AM");
    expect(text).toContain("11:00 PM");
    expect(message).toContain("9:00 AM");
    expect(message).not.toContain("7:00 PM");
  });

  it("[HRS-06] timezone changes the open-now result", () => {
    const schedule = week({ open: "09:00", close: "23:00" });
    const now = at("2026-09-29T05:00:00.000Z");
    expect(isKitchenOpen({ forceClosed: false, timezone: "Asia/Karachi", schedule }, now)).toBe(true);
    expect(isKitchenOpen({ forceClosed: false, timezone: "America/New_York", schedule }, now)).toBe(false);
  });

  it("[SET-02] exclusive and inclusive charges", () => {
    const added = quoteCharges(100, 20, { taxPercent: 10, taxIncluded: false, serviceChargePercent: 5, serviceIncluded: false });
    expect(added.tax).toBe(10);
    expect(added.service).toBe(5);
    expect(added.total).toBe(135);
    const included = quoteCharges(110, 0, { taxPercent: 10, taxIncluded: true, serviceChargePercent: 0, serviceIncluded: false });
    expect(included.tax).toBe(10);
    expect(included.total).toBe(110);
  });

  it("[SET-03] rejects a bad phone, URL, latitude, and time", () => {
    const errors = validateSettingsInput({
      phone: "nope",
      facebookUrl: "facebook.com/x",
      latitude: 120,
      weeklySchedule: { mon: { closed: false, slots: [{ open: "25:00", close: "09:00" }] } },
    });
    expect(errors.phone).toBeTruthy();
    expect(errors.facebookUrl).toBeTruthy();
    expect(errors.latitude).toBeTruthy();
    expect(errors["hours.mon"]).toBeTruthy();
  });

  it("[SET-04] onboarding is required until a name is saved", () => {
    expect(needsRestaurantName("")).toBe(true);
    expect(needsRestaurantName("  ")).toBe(true);
    expect(needsRestaurantName("Pizza Hub")).toBe(false);
  });

  it("[SET-05] payment toggles change the customer-facing summary", () => {
    expect(paymentSummary(true, false)).toContain("cash on delivery");
    expect(paymentSummary(true, false)).not.toContain("card");
    expect(paymentSummary(false, true)).toContain("card at the counter");
    expect(paymentSummary(false, false)).toContain("Ask the restaurant");
  });

  it("keeps a saved weekly schedule instead of the legacy pair", () => {
    const schedule = coerceSchedule(
      { mon: { closed: true, slots: [] } },
      { openHour: 9, openMinute: 0, closeHour: 17, closeMinute: 0 }
    );
    expect(schedule.mon.closed).toBe(true);
    expect(schedule.tue.slots[0].open).toBe("09:00");
  });
});
