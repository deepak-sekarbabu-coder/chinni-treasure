"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import {
  createOrder,
  createProduct,
  deleteProduct,
  exportToExcel,
  logout,
  updateOrderStatus,
  updateProduct,
} from "@/src/lib/api";
import type {
  CreateOrderInput,
  Order,
  Product,
  ProductInput,
  UpdateOrderStatusInput,
} from "@/src/lib/api-schemas";

function invalidateAdminQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  ]);
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation<Order, Error, { orderId: string; input: UpdateOrderStatusInput }>({
    mutationFn: ({ orderId, input }) => updateOrderStatus(orderId, input),
    onSuccess: () => invalidateAdminQueries(queryClient),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, ProductInput>({
    mutationFn: (input) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation<Product, Error, { productId: string; input: ProductInput }>({
    mutationFn: ({ productId, input }) => updateProduct(productId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
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
