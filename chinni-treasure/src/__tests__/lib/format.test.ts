import { describe, it, expect } from "vitest";
import { formatRupees, formatINR, formatMoney, formatShipping } from "../../lib/format";

describe("formatRupees", () => {
  it("formats a positive integer with no decimals", () => {
    expect(formatRupees(599)).toBe("599");
  });

  it("formats a positive decimal with two decimal places", () => {
    expect(formatRupees(599.5)).toBe("599.50");
  });

  it("rounds values with more than two decimal places", () => {
    expect(formatRupees(599.996)).toBe("600");
  });

  it("normalizes negative values to 0", () => {
    expect(formatRupees(-100)).toBe("0");
  });

  it("formats zero", () => {
    expect(formatRupees(0)).toBe("0");
  });

  it("formats large values with Indian comma grouping", () => {
    expect(formatRupees(123456)).toBe("1,23,456");
  });
});

describe("formatINR", () => {
  it("formats without the ₹ symbol, always two decimals", () => {
    expect(formatINR(599)).toBe("599.00");
  });

  it("formats decimal values with Indian comma grouping", () => {
    expect(formatINR(1234.5)).toBe("1,234.50");
  });

  it("normalizes negative values to 0", () => {
    expect(formatINR(-100)).toBe("0.00");
  });
});

describe("formatMoney", () => {
  it("formats with the ₹ symbol and two decimals", () => {
    expect(formatMoney(599)).toBe("₹599.00");
  });

  it("renders without digit grouping", () => {
    expect(formatMoney(1234.5)).toBe("₹1234.50");
    expect(formatMoney(1234.5, { bare: true })).toBe("1234.50");
  });

  it("normalizes negative values to 0", () => {
    expect(formatMoney(-100)).toBe("₹0.00");
  });
});

describe("formatShipping", () => {
  it("renders Free for a zero shipping cost", () => {
    expect(formatShipping(0)).toBe("Free");
  });

  it("renders the em dash when shipping has not been computed", () => {
    expect(formatShipping(-1)).toBe("—");
  });

  it("renders the money value otherwise", () => {
    expect(formatShipping(200)).toBe("₹200.00");
  });
});
