import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "../src/lib/money";
import { getRestaurantId, runWithRestaurant } from "../src/lib/restaurant-context";

describe("[BR-06] formatMoney", () => {
  it("renders PKR without a stray decimal", () => {
    expect(formatMoney(11274.7, { currencyCode: "PKR", currencySymbol: "Rs" })).toBe("Rs 11,275");
    expect(formatMoney("1234", { currencyCode: "PKR", currencySymbol: "Rs" })).toBe("Rs 1,234");
  });

  it("keeps two decimals for currencies that use them", () => {
    expect(formatMoney("11.5", { currencyCode: "USD", currencySymbol: "$" })).toBe("$ 11.50");
  });

  it("converts decimal strings to minor units exactly", () => {
    expect(toMinorUnits("33.33")).toBe(3333);
    expect(toMinorUnits("33.33") * 3).toBe(9999);
  });
});

describe("[BR-07] restaurant scope", () => {
  it("uses the restaurant id from the current context", () => {
    const seen = runWithRestaurant("restaurant-b", () => getRestaurantId());
    expect(seen).toBe("restaurant-b");
    expect(getRestaurantId()).not.toBe("restaurant-b");
  });
});
