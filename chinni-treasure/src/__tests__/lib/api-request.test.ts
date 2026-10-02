import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAuthMe, fetchProducts } from "@/src/lib/api";

/**
 * The two behaviours the transport refactor changed: `fetchAuthMe` now goes
 * through `apiFetch` (so an unauthenticated visitor reads `authenticated:
 * false`, not a thrown ApiError), and query building goes through one encoder
 * that drops server defaults.
 */
describe("api request layer", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function jsonResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: "Unauthorized",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response;
  }

  it("answers { authenticated: false } instead of throwing on a 401", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Not authenticated" }, 401));

    await expect(fetchAuthMe()).resolves.toEqual({ authenticated: false });
  });

  it("parses the authenticated session through the same transport", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ authenticated: true, id: "1", username: "root", role: "super_admin" }),
    );

    await expect(fetchAuthMe()).resolves.toMatchObject({ authenticated: true, username: "root" });
  });

  it("omits defaulted query values and keeps the ones that differ", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ products: [], total: 0, page: 1, limit: 10, totalPages: 1 }),
    );

    await fetchProducts({ page: 1, limit: 10, badge: "all", sort: "newest", search: "silk" });

    // `page` is always sent (it has no declared default here); `limit`,
    // `badge` and `sort` are omitted because the server applies those.
    expect(fetchMock.mock.calls[0][0]).toBe("/api/products?page=1&search=silk");
  });
});