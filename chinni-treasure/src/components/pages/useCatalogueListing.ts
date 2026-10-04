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
import { totalPages as pageCount } from "@/src/lib/list-query";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

/** What a catalogue page's SSR read hands to the client query. */
export interface ListingSeed {
  products: readonly CatalogueProduct[];
  total: number;
}

/**
 * The one seed. The server renders `CATALOGUE_PAGE_SIZE` wide and the client
 * page is 3 or 6, so React Query adopts a payload trimmed to the client page
 * size, with its page count derived from that same number.
 *
 * It lives beside the page-count rule because a seed that disagrees with
 * `pageSize` paints a row the layout can't hold and paginates at the wrong
 * width — and the two pages each used to restate the whole envelope, cast their
 * SSR rows to the query's wider row shape, and re-inline the page count.
 */
export function listingSeed<E extends object>(seed: ListingSeed, page: number, pageSize: number, extra: E) {
  return {
    ...extra,
    products: seed.products.slice(0, pageSize),
    total: seed.total,
    page,
    limit: pageSize,
    totalPages: pageCount(seed.total, pageSize),
  };
}

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
  /**
   * The responsive page width, from the one `useResponsivePageSize` call the
   * page already makes to size its query. Passed in rather than read here so
   * each page subscribes to the media query once and the seed and the query can
   * never be sized differently.
   */
  pageSize: number;
  /** Wording for the failed-fetch branch. */
  errorMessage?: string;
}

export function useCatalogueListing({
  query,
  initial,
  setCurrentPage,
  pageSize,
  errorMessage = "We couldn’t load products for this selection. Please try again.",
}: ListingOptions): CatalogueListing {
  const { refetch } = query;

  const products = query.data?.products ?? initial.products;
  const total = query.data?.total ?? initial.total;
  // The server renders CATALOGUE_PAGE_SIZE wide, so its totalPages is only
  // right at that size — re-derive against the responsive page size, or mobile
  // paginates half as far as it should.
  const totalPages = query.data?.totalPages ?? pageCount(total, pageSize);
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
