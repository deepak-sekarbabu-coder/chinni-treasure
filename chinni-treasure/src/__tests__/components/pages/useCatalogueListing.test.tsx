import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ssrPageSlice, useCatalogueListing } from "@/src/components/pages/useCatalogueListing";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

const product = (id: string) => ({ id, name: id }) as CatalogueProduct;
const many = Array.from({ length: 12 }, (_, i) => product(`p${i}`));

vi.mock("@/src/lib/hooks/useResponsivePageSize", () => ({
  useResponsivePageSize: () => 6,
}));

afterEach(() => vi.restoreAllMocks());

function setup(query: Partial<Parameters<typeof useCatalogueListing>[0]["query"]> = {}) {
  const refetch = vi.fn();
  const setCurrentPage = vi.fn();
  const initial = { products: many, total: 12 };
  const { result } = renderHook(() =>
    useCatalogueListing({
      query: { isFetching: false, isPlaceholderData: false, isError: false, refetch, ...query },
      initial,
      setCurrentPage,
    }),
  );
  return { result, refetch, setCurrentPage };
}

describe("ssrPageSlice", () => {
  it("trims the SSR payload to the responsive page size", () => {
    expect(ssrPageSlice(many, 6)).toHaveLength(6);
    expect(ssrPageSlice(many, 3).map((p) => p.id)).toEqual(["p0", "p1", "p2"]);
    expect(ssrPageSlice([], 6)).toEqual([]);
  });
});

describe("useCatalogueListing", () => {
  it("falls back to the initial payload, and re-derives totalPages for the page size", () => {
    const { result } = setup();
    // The server's totalPages assumes its own fixed width; at 6/page 12 items
    // is 2 pages, which is what the grid must paginate by.
    expect(result.current.products).toHaveLength(12);
    expect(result.current.total).toBe(12);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.filterError).toBeNull();
    expect(result.current.filterLoading).toBe(false);
  });

  it("prefers the query's data when the key has real results", () => {
    const { result } = setup({
      data: { products: [product("q1")], total: 30, totalPages: 5 },
    });
    expect(result.current.products.map((p) => p.id)).toEqual(["q1"]);
    expect(result.current.total).toBe(30);
    expect(result.current.totalPages).toBe(5);
  });

  it("shows skeletons while a changed key loads on placeholder data", () => {
    const { result } = setup({ isFetching: true, isPlaceholderData: true });
    expect(result.current.filterLoading).toBe(true);
    expect(result.current.filterError).toBeNull();
  });

  // The divergence this module exists to kill: the category page had no
  // failure branch, so a failed sort fetch served the previous products.
  it("surfaces the failure once retries finish, and retries on demand", () => {
    const { result, refetch } = setup({
      isFetching: false,
      isPlaceholderData: true,
      isError: true,
    });
    expect(result.current.filterError?.message).toMatch(/couldn’t load products/i);
    act(() => result.current.filterError?.onRetry());
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("stays quiet while React Query is still retrying the failed key", () => {
    const { result } = setup({ isFetching: true, isPlaceholderData: true, isError: true });
    expect(result.current.filterError).toBeNull();
  });

  it("page change sets the page and scrolls to the top", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    const { result, setCurrentPage } = setup();
    act(() => result.current.onPageChange(3));
    expect(setCurrentPage).toHaveBeenCalledWith(3);
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
