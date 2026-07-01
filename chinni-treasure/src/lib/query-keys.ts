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
    list: (params: { page: number; limit: number; status?: string }) =>
      [...queryKeys.orders.lists(), params] as const,
    detail: (id: string) => [...queryKeys.orders.all(), "detail", id] as const,
  },
  products: {
    all: () => [...queryKeys.all, "products"] as const,
    lists: () => [...queryKeys.products.all(), "list"] as const,
    list: (params: { page: number; limit: number; isActive?: string }) =>
      [...queryKeys.products.lists(), params] as const,
    catalogues: () => [...queryKeys.products.all(), "catalogue"] as const,
    catalogue: (page: number, limit: number) =>
      [...queryKeys.products.catalogues(), { page, limit }] as const,
  },
  categories: {
    all: () => [...queryKeys.all, "categories"] as const,
  },
  track: {
    all: () => [...queryKeys.all, "track"] as const,
    search: (params: { orderId?: string; phone?: string }) =>
      [...queryKeys.track.all(), params] as const,
  },
} as const;
