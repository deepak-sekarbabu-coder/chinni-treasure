import { describe, it, expect } from "vitest";
import { generateOrderNumber, slugify } from "../../lib/utils";

describe("generateOrderNumber", () => {
  it("returns a string starting with ORD-", () => {
    const result = generateOrderNumber();
    expect(result).toMatch(/^ORD-/);
  });

  it("generates unique values on successive calls", () => {
    const numbers = Array.from({ length: 10 }, () => generateOrderNumber());
    const unique = new Set(numbers);
    expect(unique.size).toBe(10);
  });
});

describe("slugify", () => {
  it("lower cases and hyphenates spaces", () => {
    expect(slugify("Gold Rings")).toBe("gold-rings");
  });

  it("strips invalid characters and trims edges", () => {
    expect(slugify("  Bad Slug!  ")).toBe("bad-slug");
  });

  it("collapses repeated separators", () => {
    expect(slugify("silver---bangles")).toBe("silver-bangles");
  });

  it("keeps existing valid kebab-case slugs intact", () => {
    expect(slugify("leather-wallets")).toBe("leather-wallets");
  });

  it("returns empty string for input with no alphanumerics", () => {
    expect(slugify("!!!")).toBe("");
  });
});
