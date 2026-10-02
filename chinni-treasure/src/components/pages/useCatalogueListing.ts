"use client";

/**
 * The catalogue-listing module — the listing *state*, one home.
 *
 * `/catalogue` and `/category/[slug]` are the same surface with a different
 * read behind it, and each used to keep its own copy of the same state machine:
 * current page, responsive page size, the SSR-payload trim, the projection of
 * the React Query result onto what the grid needs, and the failure
 * classification. The copies had already diverged — the category page had no
 * failure branch at all, so a failed sort fetch silently served the previous
 * page's products.
 *
 * What stays with each page: its hero, its toolbar (search / category filter /
 * sort), and its own read. This owns everything that is *being a paged
 * listing*, and a third listing surface is now a call.
 */

import { useCallback, useMemo } from "react";
import { useResponsivePageSize } from "@/src/lib/hooks/useResponsivePageSize";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

/** The slice of a `useQuery` result this module reads. Both listing queries
 *  conform, which is why one hook can drive both surfaces. */
export interface ListingQuery {
  data?: { products: CatalogueProduct[]; total: number; totalPages: number } | undefined;
  isFetching: boolean;
  /** React Query is showing the *previous* key's data while the new key loads. */
  isPlaceholderData: boolean;
  isError: boolean;
  refetch: () => unknown;
}

export interface ListingInitial {
  products: CatalogueProduct[];
  total: number;
}

/**
 * Trim an SSR payload to the responsive page size. The page renders
 * CATALOGUE_PAGE_SIZE wide; the client page is 3 or 6, so the first paint has
 * to be re-sliced or the page shows a row the layout can't hold. Generic in the
 * element type, because each seed is a different response row (`Product` vs
 * `CategoryProductsResponse["products"]`).
 */
export function ssrPageSlice<T>(products: readonly T[], pageSize: number): T[] {
  return (products as T[]).slice(0, pageSize);
}

export interface CatalogueListing {
  products: CatalogueProduct[];
  total: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
  /** A filter/search change swapped the key: show skeletons, not stale rows. */
  filterLoading: boolean;
  /** The new key failed with no data to show; null when there is nothing to say. */
  filterError: { message: string; onRetry: () => void } | null;
  /** Set the page and scroll to top — what the grid's pagination calls. */
  onPageChange: (page: number) => void;
}

export interface ListingOptions {
  query: ListingQuery;
  initial: ListingInitial;
  /** Set the page — the page's own filter state, which it also feeds its read. */
  setCurrentPage: (page: number) => void;
  /** Wording for the failed-fetch branch. */
  errorMessage?: string;
}

export function useCatalogueListing({
  query,
  initial,
  setCurrentPage,
  errorMessage = "We couldn’t load products for this selection. Please try again.",
}: ListingOptions): CatalogueListing {
  const pageSize = useResponsivePageSize();
  const { refetch } = query;

  const products = query.data?.products ?? initial.products;
  const total = query.data?.total ?? initial.total;
  // The server renders CATALOGUE_PAGE_SIZE wide, so its totalPages is only
  // right at that size — re-derive against the responsive page size, or mobile
  // paginates half as far as it should.
  const totalPages = query.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  const loading = query.isFetching;

  // A key change (category, search, sort) means React Query exposes the
  // previous set as placeholder data, so the grid never empties and the
  // initial-skeleton branch never fires — the old selection silently lingers.
  // Skeletons are the honest state for that load. If the fetch then fails there
  // is no data for the new key at all, so say so instead: only after retries
  // finish, since `loading` stays true while React Query is retrying.
  const filterLoading = query.isPlaceholderData;
  const filterFailed = query.isError && query.isPlaceholderData && !loading;
  // Captured before `filterError` narrows the query union to a combination the
  // grid's error branch can't satisfy, which would make this call a type error.
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const onPageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentPage],
  );

  return useMemo(
    () => ({
      products,
      total,
      totalPages,
      pageSize,
      loading,
      filterLoading,
      filterError: filterFailed ? { message: errorMessage, onRetry: retry } : null,
      onPageChange,
    }),
    [products, total, totalPages, pageSize, loading, filterLoading, filterFailed, errorMessage, retry, onPageChange],
  );
}
