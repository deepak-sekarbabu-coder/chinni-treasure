import { describe, it, expect } from "vitest";
import { queryKeys } from "@/src/lib/query-keys";

describe("queryKeys", () => {
  it("has a stable root key", () => {
    expect(queryKeys.all).toEqual(["chinni-treasure"]);
  });

  it("builds hierarchical auth keys", () => {
    const me = queryKeys.auth.me();
    expect(me).toEqual(["chinni-treasure", "auth", "me"]);
    const all = queryKeys.auth.all();
    expect(me.slice(0, 2)).toEqual(all);
  });

  it("encodes orders list params in key", () => {
    const key = queryKeys.orders.list({ page: 2, limit: 10, status: "pending" });
    expect(key).toEqual([
      "chinni-treasure",
      "orders",
      "list",
      { page: 2, limit: 10, status: "pending" },
    ]);
  });

  it("encodes sort in orders list key when provided", () => {
    const key = queryKeys.orders.list({ page: 1, limit: 10, sort: "total-desc" });
    expect(key[3]).toEqual({ page: 1, limit: 10, sort: "total-desc" });
  });

  it("encodes products list params in key", () => {
    const key = queryKeys.products.list({ page: 1, limit: 12, isActive: "all" });
    expect(key).toEqual([
      "chinni-treasure",
      "products",
      "list",
      { page: 1, limit: 12, isActive: "all" },
    ]);
  });

  it("builds track search keys", () => {
    const key = queryKeys.track.search({ orderId: "ORD-123" });
    expect(key).toEqual(["chinni-treasure", "track", { orderId: "ORD-123" }]);
  });

  it("builds catalogue keys with page and limit", () => {
    const key = queryKeys.products.catalogue(2, 200);
    expect(key).toEqual(["chinni-treasure", "products", "catalogue", { page: 2, limit: 200, search: "", categoryId: null }]);
  });

  it("builds catalogue keys with search query", () => {
    const key = queryKeys.products.catalogue(1, 6, "SKU-123");
    expect(key).toEqual(["chinni-treasure", "products", "catalogue", { page: 1, limit: 6, search: "SKU-123", categoryId: null }]);
  });

  // The property that matters, not the array shape: a key that ignores one of
  // the inputs the read is called with serves one page's data under another's
  // key. `categories.products` used to omit `limit` from its key while the
  // fetch sent it, and a shape assertion would not have noticed.
  it("changes the category-products key when any input changes", () => {
    const base = queryKeys.categories.products("rings", { page: 1, limit: 6, sort: "newest" });

    expect(queryKeys.categories.products("rings", { page: 2, limit: 6, sort: "newest" })).not.toEqual(base);
    expect(queryKeys.categories.products("rings", { page: 1, limit: 12, sort: "newest" })).not.toEqual(base);
    expect(queryKeys.categories.products("rings", { page: 1, limit: 6, sort: "price-asc" })).not.toEqual(base);
    expect(queryKeys.categories.products("boxes", { page: 1, limit: 6, sort: "newest" })).not.toEqual(base);
    // Same inputs, same key — otherwise the cache never hits.
    expect(queryKeys.categories.products("rings", { page: 1, limit: 6, sort: "newest" })).toEqual(base);
  });

  it("defaults the category-products sort so an omitted one still keys", () => {
    expect(queryKeys.categories.products("rings", { page: 1, limit: 6 })).toEqual(
      queryKeys.categories.products("rings", { page: 1, limit: 6, sort: "newest" }),
    );
  });
});
