import { describe, it, expect } from "vitest";
import { parseListQuery, totalPages, type PageEnvelope } from "@/src/lib/list-query";
import { NextResponse } from "next/server";

const SORTS = { newest: 1, "price-asc": 2 } as const;

function isResponse(q: unknown): q is NextResponse {
  return q instanceof NextResponse;
}

describe("parseListQuery", () => {
  it("uses defaults when no params are provided", () => {
    const q = parseListQuery(new URLSearchParams(), {
      defaultLimit: 12,
      maxLimit: 60,
      defaultSort: "newest",
      sortMap: SORTS,
    });
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    expect(q).toEqual({ page: 1, limit: 12, skip: 0, sort: "newest" });
  });

  it("clamps page to >= 1 and limit to [1, maxLimit]", () => {
    const q = parseListQuery(
      new URLSearchParams({ page: "-3", limit: "999" }),
      { defaultLimit: 12, maxLimit: 60, sortMap: SORTS },
    );
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    expect(q.page).toBe(1);
    expect(q.limit).toBe(60);
    expect(q.skip).toBe(0);
  });

  it("falls back to defaults on non-numeric params", () => {
    const q = parseListQuery(
      new URLSearchParams({ page: "abc", limit: "1.5" }),
      { defaultLimit: 8, maxLimit: 20 },
    );
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    // parseInt("1.5") === 1
    expect(q).toEqual({ page: 1, limit: 1, skip: 0, sort: undefined });
  });

  it("computes skip from page and limit", () => {
    const q = parseListQuery(
      new URLSearchParams({ page: "3", limit: "10" }),
      { defaultLimit: 10, maxLimit: 100, sortMap: SORTS },
    );
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    expect(q.skip).toBe(20);
  });

  it("accepts a known sort key", () => {
    const q = parseListQuery(
      new URLSearchParams({ sort: "price-asc" }),
      { defaultLimit: 10, maxLimit: 100, sortMap: SORTS },
    );
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    expect(q.sort).toBe("price-asc");
  });

  it("returns 400 for an unknown sort key", () => {
    const q = parseListQuery(
      new URLSearchParams({ sort: "wat" }),
      { defaultLimit: 10, maxLimit: 100, sortMap: SORTS },
    );
    expect(isResponse(q)).toBe(true);
    if (!isResponse(q)) return;
    expect(q.status).toBe(400);
  });

  it("does not sort when no sortMap is provided", () => {
    const q = parseListQuery(new URLSearchParams({ sort: "wat" }), {
      defaultLimit: 8,
      maxLimit: 20,
    });
    expect(isResponse(q)).toBe(false);
    if (isResponse(q)) return;
    expect(q.sort).toBeUndefined();
  });
});

describe("totalPages", () => {
  it("never returns below 1", () => {
    expect(totalPages(0, 8)).toBe(1);
    expect(totalPages(7, 8)).toBe(1);
  });

  it("rounds up", () => {
    expect(totalPages(9, 8)).toBe(2);
    expect(totalPages(16, 8)).toBe(2);
  });
});

describe("PageEnvelope", () => {
  it("combines page meta with item payload", () => {
    const payload: PageEnvelope<{ products: string[] }> = {
      products: ["a"],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    expect(payload.products).toHaveLength(1);
  });
});