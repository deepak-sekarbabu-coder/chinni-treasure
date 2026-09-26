import { describe, it, expect } from "vitest";
import {
  isVisibleOnDomain,
  domainFilterWhere,
  normalizeHost,
  normalizeVisibleHostnames,
} from "@/src/lib/domain-filter";

const PADDED = normalizeVisibleHostnames("Example.COM,  sub.example.com ,")!;

describe("isVisibleOnDomain", () => {
  it("is visible on an allowed hostname (case-insensitive)", () => {
    expect(isVisibleOnDomain(PADDED, "EXAMPLE.com")).toBe(true);
  });

  it("is visible on a subdomain of an allowed hostname", () => {
    expect(isVisibleOnDomain(PADDED, "shop.example.com")).toBe(true);
  });

  it("is NOT visible on a substring-lookalike hostname", () => {
    expect(isVisibleOnDomain(PADDED, "fake-example.com")).toBe(false);
    expect(isVisibleOnDomain(PADDED, "badexample.com")).toBe(false);
  });

  it("is NOT visible on an unrelated hostname", () => {
    expect(isVisibleOnDomain(PADDED, "example.org")).toBe(false);
  });

  it("is visible everywhere when null or empty", () => {
    expect(isVisibleOnDomain(null, "whatever.com")).toBe(true);
    expect(isVisibleOnDomain("", "whatever.com")).toBe(true);
  });

  it("strips port and lowercases the request host", () => {
    expect(isVisibleOnDomain(PADDED, "EXAMPLE.com:3000")).toBe(true);
  });

  it("handles the legacy non-padded CSV form too", () => {
    expect(isVisibleOnDomain("example.com, sub.example.com", "shop.example.com")).toBe(true);
  });
});

describe("domainFilterWhere", () => {
  it("returns a bounded (not substring) token match for each host suffix", () => {
    const where = domainFilterWhere("shop.example.com") as { OR: object[] };
    expect(where.OR).toContainEqual({ visibleHostnames: { contains: ", example.com, ", mode: "insensitive" } });
  });

  it("is unconstrained for null hostname", () => {
    expect(domainFilterWhere(null)).toEqual({});
  });

  it("matches the canonical padded form that normalizeVisibleHostnames writes", () => {
    expect(PADDED).toContain(", example.com, ");
    expect(PADDED).toContain(", sub.example.com, ");
  });

  it("agrees with the JS predicate on the substring boundary", () => {
    expect(PADDED).not.toContain(", fake-example.com, ");
  });
});

describe("normalizeHost", () => {
  it("strips port and lowercases", () => {
    expect(normalizeHost("EXAMPLE.com:3000")).toBe("example.com");
  });

  it("returns null for empty input", () => {
    expect(normalizeHost("")).toBeNull();
    expect(normalizeHost(null)).toBeNull();
  });
});