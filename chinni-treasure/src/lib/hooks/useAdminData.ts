"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import {
  fetchAuthMe,
  fetchCatalogueProducts,
  fetchOrders,
  fetchProducts,
  fetchStats,
  type OrdersQueryParams,
  type ProductsQueryParams,
} from "@/src/lib/api";
import type { ProductsResponse } from "@/src/lib/api/schemas";

const ITEMS_PER_PAGE = 10;
const PRODUCTS_PER_PAGE = 12;
const CATALOGUE_PAGE_SIZE = 6;

export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }) => fetchAuthMe(signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats.all(),
    queryFn: ({ signal }) => fetchStats(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useAdminOrders(params: OrdersQueryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: ({ signal }) => fetchOrders(params, signal),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 15_000,
  });
}

export function useAdminProducts(params: ProductsQueryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => fetchProducts(params, signal),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useCatalogueProducts(page: number, initialData?: ProductsResponse) {
  return useQuery({
    queryKey: queryKeys.products.catalogue(page, CATALOGUE_PAGE_SIZE),
    queryFn: ({ signal }) => fetchCatalogueProducts(page, CATALOGUE_PAGE_SIZE, signal),
    initialData: page === 1 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export const ADMIN_PAGE_SIZES = {
  orders: ITEMS_PER_PAGE,
  products: PRODUCTS_PER_PAGE,
  catalogue: CATALOGUE_PAGE_SIZE,
} as const;
