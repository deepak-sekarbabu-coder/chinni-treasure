"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import {
  createCategory,
  createOrder,
  createProduct,
  deleteCategory,
  deleteProduct,
  exportToExcel,
  logout,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateTrackingId,
} from "@/src/lib/api";
import type {
  CategoryDetail,
  CreateCategoryInput,
  CreateOrderInput,
  Order,
  Product,
  ProductInput,
  UpdateCategoryInput,
  UpdateOrderStatusInput,
} from "@/src/lib/api/schemas";

function invalidateAdminQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  ]);
}

/** Any cached product list shape — admin list pages and public catalogue grids. */
type ProductListData = { products: Product[] };

/** The two query-key groups that hold product lists. */
const PRODUCT_LIST_KEY_GROUPS = [
  queryKeys.products.lists(),
  queryKeys.products.catalogues(),
] as const;

/**
 * Patch every cached product list (admin lists + public catalogue grids) so a
 * create/update reflects immediately: replaces the product in place, or
 * prepends it when the cache hasn't seen it yet.
 */
export function patchProductCache(queryClient: ReturnType<typeof useQueryClient>, product: Product) {
  for (const keyGroup of PRODUCT_LIST_KEY_GROUPS) {
    for (const [queryKey, previousData] of queryClient.getQueriesData<ProductListData>({ queryKey: keyGroup })) {
      if (!previousData?.products) continue;

      const nextProducts = previousData.products.some((item) => item.id === product.id)
        ? previousData.products.map((item) => (item.id === product.id ? product : item))
        : [product, ...previousData.products];

      queryClient.setQueryData(queryKey, { ...previousData, products: nextProducts });
    }
  }
}

/**
 * Remove a product from every cached product list (admin lists + catalogue
 * grids) after a delete.
 */
export function removeProductFromCache(queryClient: ReturnType<typeof useQueryClient>, productId: string) {
  for (const keyGroup of PRODUCT_LIST_KEY_GROUPS) {
    queryClient.setQueriesData<ProductListData | undefined>({ queryKey: keyGroup }, (previousData) => {
      if (!previousData?.products) return previousData;
      return { ...previousData, products: previousData.products.filter((item) => item.id !== productId) };
    });
  }
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { orderId: string; input: UpdateOrderStatusInput }>({
    mutationFn: ({ orderId, input }) => updateOrderStatus(orderId, input),
    onSuccess: () => invalidateAdminQueries(queryClient),
  });
}

export function useUpdateTrackingId() {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { orderId: string; trackingId: string }>({
    mutationFn: ({ orderId, trackingId }) => updateTrackingId(orderId, { trackingId }),
    onSuccess: () => invalidateAdminQueries(queryClient),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, ProductInput>({
    mutationFn: (input) => createProduct(input),
    onSuccess: (product) => {
      patchProductCache(queryClient, product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, { productId: string; input: ProductInput }>({
    mutationFn: ({ productId, input }) => updateProduct(productId, input),
    onSuccess: (product) => {
      patchProductCache(queryClient, product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: async (_data, productId) => {
      removeProductFromCache(queryClient, productId);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useExportToExcel() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => exportToExcel(),
  });
}

export function usePlaceOrder() {
  return useMutation<Order, Error, CreateOrderInput>({
    mutationFn: (input) => createOrder(input),
  });
}

function invalidateCategoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  ]);
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryDetail, Error, CreateCategoryInput>({
    mutationFn: (input) => createCategory(input),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<
    CategoryDetail,
    Error,
    { id: number; input: UpdateCategoryInput }
  >({
    mutationFn: ({ id, input }) => updateCategory(id, input),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
}

export function useToggleCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation<
    CategoryDetail,
    Error,
    { id: number; isActive: boolean }
  >({
    mutationFn: ({ id, isActive }) =>
      updateCategory(id, { isActive }),
    onSuccess: () => invalidateCategoryQueries(queryClient),
  });
}
