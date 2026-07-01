import { apiFetch } from "./client";
import {
  AuthMeResponseSchema,
  CategoriesResponseSchema,
  CreateOrderInputSchema,
  OrderSchema,
  OrdersResponseSchema,
  ProductInputSchema,
  ProductSchema,
  ProductsResponseSchema,
  StatsResponseSchema,
  TrackOrdersResponseSchema,
  UpdateOrderStatusInputSchema,
  type AuthMeResponse,
  type CategoriesResponse,
  type CreateOrderInput,
  type Order,
  type OrdersResponse,
  type Product,
  type ProductInput,
  type ProductsResponse,
  type StatsResponse,
  type TrackOrdersResponse,
  type UpdateOrderStatusInput,
} from "./schemas";

export async function fetchAuthMe(signal?: AbortSignal): Promise<AuthMeResponse> {
  const res = await fetch("/api/auth/me", {
    signal,
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const json = (await res.json().catch(() => ({ authenticated: false }))) as unknown;
  return AuthMeResponseSchema.parse(json);
}

export function fetchStats(signal?: AbortSignal) {
  return apiFetch<StatsResponse>("/api/stats", { signal, schema: StatsResponseSchema });
}

export interface OrdersQueryParams {
  page: number;
  limit: number;
  status?: string;
}

export function fetchOrders(params: OrdersQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  return apiFetch<OrdersResponse>(`/api/orders?${search.toString()}`, {
    signal,
    schema: OrdersResponseSchema,
  });
}

export interface ProductsQueryParams {
  page: number;
  limit: number;
  isActive?: "all" | "active";
}

export function fetchProducts(params: ProductsQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.isActive) search.set("isActive", params.isActive);
  return apiFetch<ProductsResponse>(`/api/products?${search.toString()}`, {
    signal,
    schema: ProductsResponseSchema,
  });
}

export function fetchCatalogueProducts(page: number = 1, limit: number = 6, signal?: AbortSignal) {
  // Defensive: ensure page and limit are valid numbers
  const safePage = typeof page === "number" && Number.isFinite(page) && page >= 1 ? page : 1;
  const safeLimit = typeof limit === "number" && Number.isFinite(limit) && limit >= 1 ? limit : 6;
  return apiFetch<ProductsResponse>(`/api/products?page=${safePage}&limit=${safeLimit}`, {
    signal,
    schema: ProductsResponseSchema,
  });
}

export interface TrackQueryParams {
  orderId?: string;
  phone?: string;
}

export function searchTrack(params: TrackQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.orderId) search.set("orderId", params.orderId);
  if (params.phone) search.set("phone", params.phone);
  return apiFetch<TrackOrdersResponse>(`/api/track?${search.toString()}`, {
    signal,
    schema: TrackOrdersResponseSchema,
  });
}

export function createOrder(input: CreateOrderInput, signal?: AbortSignal) {
  const parsed = CreateOrderInputSchema.parse(input);
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    body: parsed,
    signal,
    schema: OrderSchema,
  });
}

export function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
  signal?: AbortSignal,
) {
  const parsed = UpdateOrderStatusInputSchema.parse(input);
  return apiFetch<Order>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: parsed,
    signal,
    schema: OrderSchema,
  });
}

export function createProduct(input: ProductInput, signal?: AbortSignal) {
  const parsed = ProductInputSchema.parse(input);
  return apiFetch<Product>("/api/products", {
    method: "POST",
    body: parsed,
    signal,
    schema: ProductSchema,
  });
}

export function updateProduct(
  productId: string,
  input: ProductInput,
  signal?: AbortSignal,
) {
  const parsed = ProductInputSchema.parse(input);
  return apiFetch<Product>(`/api/products/${productId}`, {
    method: "PUT",
    body: parsed,
    signal,
    schema: ProductSchema,
  });
}

export function deleteProduct(productId: string, signal?: AbortSignal) {
  return apiFetch<void>(`/api/products/${productId}`, {
    method: "DELETE",
    signal,
  });
}

export async function logout(signal?: AbortSignal) {
  await apiFetch<void>("/api/auth/logout", { method: "POST", signal });
}

export function fetchCategories(signal?: AbortSignal) {
  return apiFetch<CategoriesResponse>("/api/categories", {
    signal,
    schema: CategoriesResponseSchema,
  });
}

export function exportToExcel() {
  return apiFetch<Blob>("/api/export", { responseType: "blob" });
}
