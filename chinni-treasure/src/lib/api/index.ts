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
  UpdateProductInputSchema,
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
  type CreateOrderRequest,
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

/**
 * Build a query string, dropping any value that equals its declared default —
 * those are the same defaults the server applies, so sending them adds
 * nothing. One encoder so a changed default is one edit, not one per caller.
 */
function qs(params: Record<string, string | number | undefined>, defaults?: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === defaults?.[key]) continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** The one admin list page size the server defaults to. */
const DEFAULT_LIMIT = 10;

export async function fetchAuthMe(signal?: AbortSignal): Promise<AuthMeResponse> {
  // The one endpoint that must answer `{ authenticated: false }` rather than
  // throw: an unauthenticated 401 is a normal state here, not a failure. It
  // still goes through apiFetch, so headers, credentials and error shaping
  // are the transport's, not this function's.
  try {
    return await apiFetch<AuthMeResponse>("/api/auth/me", {
      signal,
      schema: AuthMeResponseSchema,
    });
  } catch {
    return { authenticated: false };
  }
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
  return apiFetch<OrdersResponse>(
    `/api/orders${qs(
      { page: params.page, limit: params.limit, status: params.status, sort: params.sort },
      { limit: DEFAULT_LIMIT, status: "all", sort: "date-desc" },
    )}`,
    { signal, schema: OrdersResponseSchema },
  );
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
  return apiFetch<ProductsResponse>(
    `/api/products${qs(
      {
        page: params.page,
        limit: params.limit,
        isActive: params.isActive,
        search: params.search,
        categoryId:
          params.categoryId && Number.isFinite(params.categoryId) ? params.categoryId : undefined,
        badge: params.badge,
        sort: params.sort,
      },
      { limit: DEFAULT_LIMIT, badge: "all", sort: "newest" },
    )}`,
    { signal, schema: ProductsResponseSchema },
  );
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
  return apiFetch<ProductsResponse>(
    `/api/products${qs({
      page: safePage,
      limit: safeLimit,
      search,
      categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : undefined,
    })}`,
    { signal, schema: ProductsResponseSchema },
  );
}

export interface TrackQueryParams {
  orderId?: string;
  phone?: string;
}

export function searchTrack(params: TrackQueryParams, signal?: AbortSignal) {
  return apiFetch<TrackOrdersResponse>(
    `/api/track${qs({ orderId: params.orderId, phone: params.phone })}`,
    { signal, schema: TrackOrdersResponseSchema },
  );
}

export function createOrder(input: CreateOrderRequest, signal?: AbortSignal) {
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
  const parsed = UpdateProductInputSchema.parse(input);
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
  return apiFetch<CategoryProductsResponse>(
    `/api/category/${encodeURIComponent(slug)}/products${qs(
      { page: params.page, limit: params.limit, sort: params.sort },
      { page: 1, sort: "newest" },
    )}`,
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
