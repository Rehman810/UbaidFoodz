import { describe, expect, it } from "vitest";
import { ReservationStatus, TableStatus } from "@prisma/client";
import { assertReservationTransition, canTransitionReservation } from "../src/lib/dine-in/reservation-machine";
import { normalizeGuestEmail, normalizeGuestPhone } from "../src/lib/dine-in/validation";
import { resolveDisplayStatus, displayToLegacyStatus } from "../src/lib/dine-in/display-status";
import { branchHasCapacity, intervalsOverlap } from "../src/lib/dine-in/availability";
import { graceMinutesRemaining, seatingWindowError } from "../src/lib/dine-in/seating-window";

describe("reservation state machine", () => {
  it("allows pending to confirmed and rejected", () => {
    expect(canTransitionReservation(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)).toBe(true);
    expect(canTransitionReservation(ReservationStatus.PENDING, ReservationStatus.REJECTED)).toBe(true);
  });
  it("rejects pending to seated", () => {
    expect(canTransitionReservation(ReservationStatus.PENDING, ReservationStatus.SEATED)).toBe(false);
    expect(() => assertReservationTransition(ReservationStatus.PENDING, ReservationStatus.SEATED)).toThrow();
  });
  it("confirmed to no-show", () => {
    expect(canTransitionReservation(ReservationStatus.CONFIRMED, ReservationStatus.NO_SHOW)).toBe(true);
  });
});

describe("guest validation", () => {
  it("requires valid email", () => {
    expect(normalizeGuestEmail("bad")).toBeNull();
    expect(normalizeGuestEmail("a@b.co")).toBe("a@b.co");
  });
  it("normalizes PK phone", () => {
    expect(normalizeGuestPhone("03001234567")).toBe("03001234567");
    expect(normalizeGuestPhone("+923001234567")).toBe("03001234567");
    expect(normalizeGuestPhone("123")).toBeNull();
  });
});

describe("computed table status", () => {
  const now = new Date("2026-10-10T14:00:00.000Z");
  it("open session is seated", () => {
    const d = resolveDisplayStatus(TableStatus.AVAILABLE, true, [], now, 15);
    expect(d).toBe("SEATED");
    expect(displayToLegacyStatus(d)).toBe(TableStatus.OCCUPIED);
  });
  it("confirmed reservation in window is reserved", () => {
    const startsAt = new Date("2026-10-10T14:30:00.000Z");
    const d = resolveDisplayStatus(
      TableStatus.AVAILABLE,
      false,
      [{ status: ReservationStatus.CONFIRMED, startsAt }],
      now,
      15
    );
    expect(d).toBe("RESERVED");
  });
  it("cleaning state", () => {
    expect(resolveDisplayStatus(TableStatus.NEEDS_CLEANING, false, [], now, 15)).toBe("CLEANING");
  });
});

describe("seating window", () => {
  const startsAt = new Date("2026-10-10T18:00:00.000Z");
  it("rejects unconfirmed", () => {
    expect(seatingWindowError(new Date("2026-10-10T17:50:00.000Z"), startsAt, 15, ReservationStatus.PENDING)).toBe(
      "NOT_CONFIRMED"
    );
  });
  it("allows within grace", () => {
    const now = new Date("2026-10-10T18:10:00.000Z");
    expect(seatingWindowError(now, startsAt, 15, ReservationStatus.CONFIRMED)).toBeNull();
    expect(graceMinutesRemaining(now, startsAt, 15)).toBe(5);
  });
  it("expires after grace", () => {
    const now = new Date("2026-10-10T18:20:00.000Z");
    expect(seatingWindowError(now, startsAt, 15, ReservationStatus.CONFIRMED)).toBe("GRACE_EXPIRED");
  });
});

describe("availability overlap", () => {
  it("detects overlapping intervals", () => {
    const a0 = new Date("2026-10-10T18:00:00Z");
    const a1 = new Date("2026-10-10T19:30:00Z");
    const b0 = new Date("2026-10-10T19:00:00Z");
    const b1 = new Date("2026-10-10T20:00:00Z");
    expect(intervalsOverlap(a0, a1, b0, b1)).toBe(true);
  });
  it("branch capacity when one table fits", () => {
    const ok = branchHasCapacity(
      [{ id: "t1", capacity: 4 }],
      2,
      new Date("2026-10-10T18:00:00Z"),
      90,
      [],
      []
    );
    expect(ok).toBe(true);
  });
});
