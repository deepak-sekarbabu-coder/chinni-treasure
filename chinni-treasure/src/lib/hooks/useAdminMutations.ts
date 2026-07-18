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
  ProductsResponse,
  UpdateCategoryInput,
  UpdateOrderStatusInput,
  UpdateTrackingInput,
} from "@/src/lib/api/schemas";

function invalidateAdminQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  ]);
}

function patchProductListCache(queryClient: ReturnType<typeof useQueryClient>, product: Product) {
  const productListQueries = queryClient.getQueriesData<ProductsResponse>({
    queryKey: queryKeys.products.lists(),
  });

  for (const [queryKey, previousData] of productListQueries) {
    if (!previousData?.products) continue;

    const productIndex = previousData.products.findIndex((item) => item.id === product.id);
    const nextProducts = previousData.products.map((item) => (item.id === product.id ? product : item));

    if (productIndex === -1) {
      queryClient.setQueryData(queryKey, {
        ...previousData,
        products: [product, ...previousData.products],
      });
      continue;
    }

    queryClient.setQueryData(queryKey, {
      ...previousData,
      products: nextProducts,
    });
  }

  const catalogueQueries = queryClient.getQueriesData<{ products: Product[] }>({
    queryKey: queryKeys.products.catalogues(),
  });

  for (const [queryKey, previousData] of catalogueQueries) {
    if (!previousData?.products) continue;

    const catalogueIndex = previousData.products.findIndex((item) => item.id === product.id);
    const nextProducts = previousData.products.map((item) => (item.id === product.id ? product : item));

    if (catalogueIndex === -1) {
      queryClient.setQueryData(queryKey, {
        ...previousData,
        products: [product, ...previousData.products],
      });
      continue;
    }

    queryClient.setQueryData(queryKey, {
      ...previousData,
      products: nextProducts,
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
      patchProductListCache(queryClient, product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, { productId: string; input: ProductInput }>({
    mutationFn: ({ productId, input }) => updateProduct(productId, input),
    onSuccess: (product) => {
      patchProductListCache(queryClient, product);
      return queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: async (_data, productId) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists() },
        (previousData: ProductsResponse | undefined) => {
          if (!previousData?.products) return previousData;
          return {
            ...previousData,
            products: previousData.products.filter((item) => item.id !== productId),
          };
        },
      );
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.catalogues() },
        (previousData: { products: Product[] } | undefined) => {
          if (!previousData?.products) return previousData;
          return {
            ...previousData,
            products: previousData.products.filter((item) => item.id !== productId),
          };
        },
      );
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
