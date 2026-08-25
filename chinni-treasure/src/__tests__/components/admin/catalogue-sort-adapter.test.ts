import { describe, it, expect } from "vitest";
import { apiSortToSorting, sortingToApiSort } from "@/src/components/admin/table/columns.catalogue";

describe("catalogue sort adapter", () => {
  it("maps every API sort string to table state and back", () => {
    const apiSorts = [
      "newest", "oldest", "name-asc", "name-desc", "price-asc",
      "price-desc", "stock-desc", "stock-asc", "sku-asc", "sku-desc",
    ];
    for (const apiSort of apiSorts) {
      const sorting = apiSortToSorting(apiSort);
      const roundTripped = sorting.length === 0 ? "newest" : sortingToApiSort(sorting);
      expect(roundTripped).toBe(apiSort);
    }
  });

  it("returns empty sorting for the newest default", () => {
    expect(apiSortToSorting("newest")).toEqual([]);
  });

  it("returns newest for empty sorting state", () => {
    expect(sortingToApiSort([])).toBe("newest");
  });

  it("rejects unknown sort ids", () => {
    expect(sortingToApiSort([{ id: "hacker", desc: true }])).toBe("newest");
    expect(apiSortToSorting("bogus")).toEqual([]);
  });
});
