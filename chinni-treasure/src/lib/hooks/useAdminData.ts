"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import {
  fetchAuthMe,
  fetchCatalogueProducts,
  fetchCategories,
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

export function useCatalogueProducts(page: number, limit: number = CATALOGUE_PAGE_SIZE, search?: string, initialData?: ProductsResponse) {
  return useQuery({
    queryKey: queryKeys.products.catalogue(page, limit, search),
    queryFn: ({ signal }) => fetchCatalogueProducts(page, limit, search, signal),
    initialData: page === 1 && !search ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useAdminCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: ({ signal }) => fetchCategories(signal),
    enabled,
    staleTime: 300_000,
  });
}

export const ADMIN_PAGE_SIZES = {
  orders: ITEMS_PER_PAGE,
  products: PRODUCTS_PER_PAGE,
  catalogue: CATALOGUE_PAGE_SIZE,
} as const;
