export const queryKeys = {
  all: ["chinni-treasure"] as const,
  auth: {
    all: () => [...queryKeys.all, "auth"] as const,
    me: () => [...queryKeys.auth.all(), "me"] as const,
  },
  stats: {
    all: () => [...queryKeys.all, "stats"] as const,
  },
  orders: {
    all: () => [...queryKeys.all, "orders"] as const,
    lists: () => [...queryKeys.orders.all(), "list"] as const,
    list: (params: { page: number; limit: number; status?: string; sort?: string }) =>
      [...queryKeys.orders.lists(), params] as const,
    detail: (id: string) => [...queryKeys.orders.all(), "detail", id] as const,
  },
  products: {
    all: () => [...queryKeys.all, "products"] as const,
    lists: () => [...queryKeys.products.all(), "list"] as const,
    list: (params: { page: number; limit: number; isActive?: string; search?: string; categoryId?: number; badge?: string; sort?: string }) =>
      [...queryKeys.products.lists(), params] as const,
    catalogues: () => [...queryKeys.products.all(), "catalogue"] as const,
    catalogue: (page: number, limit: number, search?: string, categoryId?: number) =>
      [...queryKeys.products.catalogues(), { page, limit, search: search || "", categoryId: categoryId ?? null }] as const,
  },
  categories: {
    all: () => [...queryKeys.all, "categories"] as const,
    lists: () => [...queryKeys.categories.all(), "list"] as const,
    list: (includeInactive?: boolean) =>
      [...queryKeys.categories.lists(), { includeInactive: !!includeInactive }] as const,
    detail: (id: number) => [...queryKeys.categories.all(), "detail", id] as const,
    latest: () => [...queryKeys.categories.all(), "latest"] as const,
    products: (slug: string, page: number, sort?: string) =>
      [...queryKeys.categories.all(), "products", slug, { page, sort: sort || "newest" }] as const,
  },
  track: {
    all: () => [...queryKeys.all, "track"] as const,
    search: (params: { orderId?: string; phone?: string }) =>
      [...queryKeys.track.all(), params] as const,
  },
} as const;
