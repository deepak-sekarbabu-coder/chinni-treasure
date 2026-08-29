import { apiFetch } from "./client";
import {
  AuthMeResponseSchema,
  CategoriesResponseSchema,
  CategoryDetailSchema,
  CategoryProductsResponseSchema,
  CreateCategorySchema,
  LatestCategoriesResponseSchema,
  UpdateCategorySchema,
  CreateOrderInputSchema,
  OrderSchema,
  OrdersResponseSchema,
  ProductInputSchema,
  ProductSchema,
  ProductsResponseSchema,
  StatsResponseSchema,
  TrackOrdersResponseSchema,
  UpdateOrderStatusInputSchema,
  UpdateTrackingInputSchema,
  CreateRazorpayOrderInputSchema,
  CreateRazorpayOrderResponseSchema,
  VerifyRazorpayPaymentInputSchema,
  VerifyRazorpayPaymentResponseSchema,
  type AuthMeResponse,
  type CategoriesResponse,
  type CategoryDetail,
  type CategoryProductsResponse,
  type CreateCategoryInput,
  type CreateOrderInput,
  type LatestCategoriesResponse,
  type UpdateCategoryInput,
  type CreateRazorpayOrderInput,
  type CreateRazorpayOrderResponse,
  type Order,
  type OrdersResponse,
  type Product,
  type ProductInput,
  type ProductsResponse,
  type StatsResponse,
  type TrackOrdersResponse,
  type UpdateOrderStatusInput,
  type UpdateTrackingInput,
  type VerifyRazorpayPaymentInput,
  type VerifyRazorpayPaymentResponse,
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
  sort?: string;
}

export function fetchOrders(params: OrdersQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status && params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.sort && params.sort !== "date-desc") {
    search.set("sort", params.sort);
  }
  return apiFetch<OrdersResponse>(`/api/orders?${search.toString()}`, {
    signal,
    schema: OrdersResponseSchema,
  });
}

export interface ProductsQueryParams {
  page: number;
  limit: number;
  isActive?: "all" | "active" | "inactive";
  search?: string;
  categoryId?: number;
  badge?: string;
  sort?: string;
}

export function fetchProducts(params: ProductsQueryParams, signal?: AbortSignal) {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.isActive) search.set("isActive", params.isActive);
  if (params.search) search.set("search", params.search);
  if (params.categoryId && Number.isFinite(params.categoryId)) search.set("categoryId", String(params.categoryId));
  if (params.badge && params.badge !== "all") search.set("badge", params.badge);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  return apiFetch<ProductsResponse>(`/api/products?${search.toString()}`, {
    signal,
    schema: ProductsResponseSchema,
  });
}

export function fetchCatalogueProducts(
  page: number = 1,
  limit: number = 6,
  search?: string,
  signal?: AbortSignal,
  categoryId?: number,
) {
  // Defensive: ensure page and limit are valid numbers
  const safePage = typeof page === "number" && Number.isFinite(page) && page >= 1 ? page : 1;
  const safeLimit = typeof limit === "number" && Number.isFinite(limit) && limit >= 1 ? limit : 6;
  const params = new URLSearchParams({ page: String(safePage), limit: String(safeLimit) });
  if (search) params.set("search", search);
  if (categoryId && Number.isFinite(categoryId)) params.set("categoryId", String(categoryId));
  return apiFetch<ProductsResponse>(`/api/products?${params.toString()}`, {
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

export function updateTrackingId(
  orderId: string,
  input: UpdateTrackingInput,
  signal?: AbortSignal,
) {
  const parsed = UpdateTrackingInputSchema.parse(input);
  return apiFetch<Order>(`/api/orders/${orderId}/tracking`, {
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

export function fetchCategories(signal?: AbortSignal, includeInactive = false) {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return apiFetch<CategoriesResponse>(`/api/categories${qs}`, {
    signal,
    schema: CategoriesResponseSchema,
  });
}

export function fetchLatestCategories(signal?: AbortSignal) {
  return apiFetch<LatestCategoriesResponse>("/api/categories/latest", {
    signal,
    schema: LatestCategoriesResponseSchema,
  });
}

export interface CategoryProductsParams {
  page?: number;
  limit?: number;
  sort?: "newest" | "price-asc" | "price-desc";
}

export function fetchCategoryProducts(
  slug: string,
  params: CategoryProductsParams = {},
  signal?: AbortSignal,
) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return apiFetch<CategoryProductsResponse>(
    `/api/category/${encodeURIComponent(slug)}/products${qs ? `?${qs}` : ""}`,
    { signal, schema: CategoryProductsResponseSchema },
  );
}

export function createCategory(input: CreateCategoryInput, signal?: AbortSignal) {
  const parsed = CreateCategorySchema.parse(input);
  return apiFetch<CategoryDetail>("/api/categories", {
    method: "POST",
    body: parsed,
    signal,
    schema: CategoryDetailSchema,
  });
}

export function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  signal?: AbortSignal,
) {
  const parsed = UpdateCategorySchema.parse(input);
  return apiFetch<CategoryDetail>(`/api/categories/${id}`, {
    method: "PUT",
    body: parsed,
    signal,
    schema: CategoryDetailSchema,
  });
}

export function deleteCategory(id: number, signal?: AbortSignal) {
  return apiFetch<{ success: boolean }>(`/api/categories/${id}`, {
    method: "DELETE",
    signal,
  });
}

export function exportToExcel() {
  return apiFetch<Blob>("/api/export", { responseType: "blob" });
}

export function createRazorpayOrder(input: CreateRazorpayOrderInput, signal?: AbortSignal) {
  const parsed = CreateRazorpayOrderInputSchema.parse(input);
  return apiFetch<CreateRazorpayOrderResponse>("/api/create-order", {
    method: "POST",
    body: parsed,
    signal,
    schema: CreateRazorpayOrderResponseSchema,
  });
}

export function verifyRazorpayPayment(input: VerifyRazorpayPaymentInput, signal?: AbortSignal) {
  const parsed = VerifyRazorpayPaymentInputSchema.parse(input);
  return apiFetch<VerifyRazorpayPaymentResponse>("/api/verify-payment", {
    method: "POST",
    body: parsed,
    signal,
    schema: VerifyRazorpayPaymentResponseSchema,
  });
}
