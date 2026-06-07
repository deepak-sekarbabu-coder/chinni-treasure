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

const ITEMS_PER_PAGE = 10;
const PRODUCTS_PER_PAGE = 12;
const CATALOGUE_PAGE_LIMIT = 200;

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

export function useCatalogueProducts(initialProducts: unknown[], enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.catalogue(CATALOGUE_PAGE_LIMIT),
    queryFn: ({ signal }) => fetchCatalogueProducts(CATALOGUE_PAGE_LIMIT, signal),
    enabled: enabled && initialProducts.length === 0,
    initialData: undefined,
    staleTime: 30_000,
  });
}

export const ADMIN_PAGE_SIZES = {
  orders: ITEMS_PER_PAGE,
  products: PRODUCTS_PER_PAGE,
  catalogue: CATALOGUE_PAGE_LIMIT,
} as const;
