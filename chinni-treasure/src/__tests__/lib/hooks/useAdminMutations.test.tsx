import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/src/lib/api";
import { queryKeys } from "@/src/lib/query-keys";
import {
  patchProductCache,
  removeProductFromCache,
  useDeleteProduct,
  useUpdateProduct,
} from "../../../lib/hooks/useAdminMutations";

vi.mock("@/src/lib/api", () => ({
    createOrder: vi.fn(),
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
    exportToExcel: vi.fn(),
    createCategory: vi.fn(),
    createOrder: vi.fn(),
    createProduct: vi.fn(),
    deleteCategory: vi.fn(),
    deleteProduct: vi.fn(),
    exportToExcel: vi.fn(),
    logout: vi.fn(),
    updateCategory: vi.fn(),
    updateOrderStatus: vi.fn(),
    updateProduct: vi.fn(),
    updateTrackingId: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return { queryClient, wrapper };
}

describe("useUpdateProduct", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates cached product list and catalogue data immediately after a successful save", async () => {
        const updatedProduct = {
            id: "prod-1",
            name: "Updated product",
            price: 25,
            compareAtPrice: null,
            imageUrl: null,
            description: "Updated",
            stockQuantity: 10,
            badge: null,
            category: null,
            categoryId: null,
            sku: "SKU-1",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
        };

        vi.mocked(api.updateProduct).mockResolvedValue(updatedProduct as never);

        const { queryClient, wrapper } = createWrapper();
        const listKey = queryKeys.products.list({ page: 1, limit: 10, isActive: "all" });
        const catalogueKey = queryKeys.products.catalogue(1, 6, "");

        queryClient.setQueryData(listKey, {
            products: [{ ...updatedProduct, name: "Old product" }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        });

        queryClient.setQueryData(catalogueKey, {
            products: [{ ...updatedProduct, name: "Old product" }],
        });

        const { result } = renderHook(() => useUpdateProduct(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({
                productId: "prod-1",
                input: {
                    name: "Updated product",
                    price: 25,
                    stockQuantity: 10,
                } as never,
            });
        });

        await waitFor(() => {
            const listData = queryClient.getQueryData(listKey) as { products: Array<{ id: string; name: string }> };
            const catalogueData = queryClient.getQueryData(catalogueKey) as { products: Array<{ id: string; name: string }> };

            expect(listData.products[0].name).toBe("Updated product");
            expect(catalogueData.products[0].name).toBe("Updated product");
        });
    });
});

function makeProduct(id: string, name: string) {
    return {
        id,
        name,
        price: 10,
        compareAtPrice: null,
        imageUrl: null,
        description: null,
        stockQuantity: 5,
        badge: null,
        category: null,
        categoryId: null,
        sku: null,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
    } as never;
}

describe("patchProductCache", () => {
    it("replaces an existing product in place in both list and catalogue caches", () => {
        const { queryClient } = createWrapper();
        const original = makeProduct("prod-1", "Old name");
        const updated = makeProduct("prod-1", "New name");
        const listKey = queryKeys.products.list({ page: 1, limit: 10, isActive: "all" });
        const catalogueKey = queryKeys.products.catalogue(1, 6, "");

        queryClient.setQueryData(listKey, { products: [original], total: 1, page: 1, limit: 10, totalPages: 1 });
        queryClient.setQueryData(catalogueKey, { products: [original] });

        patchProductCache(queryClient, updated);

        const listData = queryClient.getQueryData(listKey) as { products: Array<{ id: string; name: string }> };
        const catalogueData = queryClient.getQueryData(catalogueKey) as { products: Array<{ id: string; name: string }> };
        expect(listData.products).toHaveLength(1);
        expect(listData.products[0].name).toBe("New name");
        expect(catalogueData.products).toHaveLength(1);
        expect(catalogueData.products[0].name).toBe("New name");
    });

    it("prepends a new product when the caches have not seen it yet", () => {
        const { queryClient } = createWrapper();
        const existing = makeProduct("prod-1", "Existing");
        const fresh = makeProduct("prod-2", "Fresh");
        const listKey = queryKeys.products.list({ page: 1, limit: 10, isActive: "all" });
        const catalogueKey = queryKeys.products.catalogue(1, 6, "");

        queryClient.setQueryData(listKey, { products: [existing], total: 1, page: 1, limit: 10, totalPages: 1 });
        queryClient.setQueryData(catalogueKey, { products: [existing] });

        patchProductCache(queryClient, fresh);

        const listData = queryClient.getQueryData(listKey) as { products: Array<{ id: string }> };
        const catalogueData = queryClient.getQueryData(catalogueKey) as { products: Array<{ id: string }> };
        expect(listData.products[0].id).toBe("prod-2");
        expect(listData.products).toHaveLength(2);
        expect(catalogueData.products[0].id).toBe("prod-2");
        expect(catalogueData.products).toHaveLength(2);
    });
});

describe("removeProductFromCache", () => {
    it("removes the product from both list and catalogue caches", () => {
        const { queryClient } = createWrapper();
        const a = makeProduct("prod-1", "A");
        const b = makeProduct("prod-2", "B");
        const listKey = queryKeys.products.list({ page: 1, limit: 10, isActive: "all" });
        const catalogueKey = queryKeys.products.catalogue(1, 6, "");

        queryClient.setQueryData(listKey, { products: [a, b], total: 2, page: 1, limit: 10, totalPages: 1 });
        queryClient.setQueryData(catalogueKey, { products: [a, b] });

        removeProductFromCache(queryClient, "prod-1");

        const listData = queryClient.getQueryData(listKey) as { products: Array<{ id: string }> };
        const catalogueData = queryClient.getQueryData(catalogueKey) as { products: Array<{ id: string }> };
        expect(listData.products.map((p) => p.id)).toEqual(["prod-2"]);
        expect(catalogueData.products.map((p) => p.id)).toEqual(["prod-2"]);
    });
});

describe("useDeleteProduct", () => {
    it("removes the product from cached lists after a successful delete", async () => {
        const product = makeProduct("prod-1", "Doomed");
        const listKey = queryKeys.products.list({ page: 1, limit: 10, isActive: "all" });
        const { queryClient, wrapper } = createWrapper();
        queryClient.setQueryData(listKey, { products: [product], total: 1, page: 1, limit: 10, totalPages: 1 });

        vi.mocked(api.deleteProduct).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteProduct(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync("prod-1");
        });

        const listData = queryClient.getQueryData(listKey) as { products: Array<{ id: string }> } | undefined;
        expect(listData?.products ?? []).toHaveLength(0);
    });
});
