import { describe, expect, it } from "vitest";
import { canTransition, nextStatus } from "../src/lib/order-machine";

describe("[ORD-01] valid transitions", () => {
  it("walks delivery, takeaway, and dine-in to their terminals", () => {
    expect(canTransition("PENDING_CONFIRMATION", "CONFIRMED", "DELIVERY")).toBe(true);
    expect(canTransition("READY", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY")).toBe(true);
    expect(nextStatus("READY", "PICKUP")).toBe("COLLECTED");
    expect(nextStatus("READY", "DINE_IN")).toBe("SERVED");
  });
});

describe("[ORD-02] illegal transitions", () => {
  it("rejects dine-in out for delivery and moving backwards", () => {
    expect(canTransition("READY", "OUT_FOR_DELIVERY", "DINE_IN")).toBe(false);
    expect(canTransition("DELIVERED", "PREPARING", "DELIVERY")).toBe(false);
    expect(canTransition("CONFIRMED", "DELIVERED", "DELIVERY")).toBe(false);
  });
});

describe("[ORD-03] terminals", () => {
  it("ends takeaway at collected and dine-in at served", () => {
    expect(nextStatus("COLLECTED", "PICKUP")).toBeNull();
    expect(nextStatus("SERVED", "DINE_IN")).toBeNull();
  });
});

describe("[ORD-04] ready is not out for delivery", () => {
  it("keeps the two statuses distinct", () => {
    expect(canTransition("PREPARING", "READY", "DELIVERY")).toBe(true);
    expect(canTransition("PREPARING", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(false);
  });
});

describe("[ORD-05] cancel", () => {
  it("allows cancel from a non-terminal status only", () => {
    expect(canTransition("CONFIRMED", "CANCELLED", "DELIVERY")).toBe(true);
    expect(canTransition("DELIVERED", "CANCELLED", "DELIVERY")).toBe(false);
  });
});
