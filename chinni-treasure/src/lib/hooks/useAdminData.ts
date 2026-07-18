"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import {
  fetchAuthMe,
  fetchCatalogueProducts,
  fetchCategories,
  fetchCategoryProducts,
  fetchOrders,
  fetchProducts,
  fetchStats,
  type CategoryProductsParams,
  type OrdersQueryParams,
  type ProductsQueryParams,
} from "@/src/lib/api";
import type { ProductsResponse, CategoryProductsResponse } from "@/src/lib/api/schemas";

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

export function useCatalogueProducts(
  page: number,
  limit: number = CATALOGUE_PAGE_SIZE,
  search?: string,
  initialData?: ProductsResponse,
  categoryId?: number,
) {
  return useQuery({
    queryKey: queryKeys.products.catalogue(page, limit, search, categoryId),
    queryFn: ({ signal }) => fetchCatalogueProducts(page, limit, search, signal, categoryId),
    initialData: page === 1 && !search && !categoryId ? initialData : undefined,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useAdminCategories(enabled = true, includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.categories.list(includeInactive),
    queryFn: ({ signal }) => fetchCategories(signal, includeInactive),
    enabled,
    staleTime: 300_000,
  });
}

export function useCategoryProducts(
  slug: string,
  page: number,
  limit: number = CATALOGUE_PAGE_SIZE,
  sort: CategoryProductsParams["sort"] = "newest",
  initialData?: CategoryProductsResponse,
) {
  return useQuery({
    queryKey: queryKeys.categories.products(slug, page, sort),
    queryFn: ({ signal }) =>
      fetchCategoryProducts(slug, { page, limit, sort }, signal),
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
