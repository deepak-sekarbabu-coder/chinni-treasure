import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CatalogueContent from "../../../components/pages/catalogue-content";

// Build mock products with unique names so we can detect which page is shown
function makeProducts(prefix: string, count: number, start = 1) {
  return Array.from({ length: count }, (_, i) => {
    const n = start + i;
    return {
      id: `${prefix}-${n}`,
      name: `${prefix} Product ${n}`,
      price: 100 + n,
      compareAtPrice: null,
      imageUrl: "/img.jpg",
      description: "desc",
      category: { name: "Cat" },
      stockQuantity: 1,
      badge: null,
      images: [],
    };
  });
}

// Mock the api module so fetchCatalogueProducts returns different pages
const fetchMock = vi.fn();
vi.mock("@/src/lib/api", () => ({
  fetchCatalogueProducts: (page: number, limit: number, _search?: string, _signal?: AbortSignal, _categoryId?: number) =>
    fetchMock(page, limit, _search, _categoryId),
}));

// jsdom does not implement matchMedia; useResponsivePageSize relies on it
beforeEach(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

// Cart / toast providers used by CatalogueContent.
// addItem returns the deepened { result, newTotal } shape.
vi.mock("@/src/components/cart/CartProvider", () => ({
  useCart: () => ({ addItem: vi.fn(() => ({ result: "added", newTotal: 0 })) }),
}));
vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function renderCatalogue(initialProducts: unknown[], initialCategories: { id: number; name: string; slug: string }[] = []) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CatalogueContent
        initialProducts={initialProducts as never}
        initialTotal={12}
        initialTotalPages={2}
        initialSearch=""
        initialCategories={initialCategories}
      />
    </QueryClientProvider>,
  );
}

describe("CatalogueContent pagination", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("shows page-2 products (not page-1) after clicking Next", async () => {
    const all12 = makeProducts("P", 12);
    // page 1 -> first 6, page 2 -> next 6
    fetchMock.mockImplementation((page: number, limit: number) => {
      const start = (page - 1) * limit;
      const slice = all12.slice(start, start + limit);
      return Promise.resolve({
        products: slice,
        total: 12,
        page,
        limit,
        totalPages: 2,
      });
    });

    renderCatalogue(all12.slice(0, 6));

    // Page 1 should show first 6
    expect(await screen.findByText("P Product 1")).toBeInTheDocument();
    expect(screen.queryByText("P Product 7")).not.toBeInTheDocument();

    // Click page 2 button
    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);

    // After navigation, page-2 products should appear and page-1 products should be gone
    await waitFor(() => {
      expect(screen.queryByText("P Product 1")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("P Product 7")).toBeInTheDocument();
    expect(screen.getByText("P Product 12")).toBeInTheDocument();
  }, 15000);

  it("shows a loading skeleton while category results are fetched", async () => {
    const all12 = makeProducts("P", 12);
    let resolveFetch: ((value: unknown) => void) | undefined;
    fetchMock.mockImplementation((page: number, limit: number, _search?: string, categoryId?: number) => {
      if (categoryId === 2) {
        // Defer category-2 results so we can observe the loading state.
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      }
      const start = (page - 1) * limit;
      const slice = all12.slice(start, start + limit);
      return Promise.resolve({
        products: slice,
        total: 12,
        page,
        limit,
        totalPages: 2,
      });
    });

    const categories = [
      { id: 1, name: "Leather", slug: "leather" },
      { id: 2, name: "Silk", slug: "silk" },
    ];
    renderCatalogue(all12.slice(0, 6), categories);
    expect(await screen.findByText("P Product 1")).toBeInTheDocument();

    const select = screen.getByLabelText("Filter products by category") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "2" } });

    // While the fetch is in flight the previous category's products must not
    // linger silently — skeletons should be shown instead.
    await waitFor(() => {
      expect(document.querySelector(".product-card.chart-skeleton")).toBeInTheDocument();
    });
    expect(screen.queryByText("P Product 1")).not.toBeInTheDocument();

    // Once the new category resolves, the products render and skeletons clear.
    resolveFetch!({
      products: all12.slice(6, 12),
      total: 6,
      page: 1,
      limit: 6,
      totalPages: 1,
    });
    expect(await screen.findByText("P Product 7")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector(".product-card.chart-skeleton")).not.toBeInTheDocument();
    });
  });

  it("passes the selected categoryId through to the fetch", async () => {
    const all12 = makeProducts("P", 12);
    fetchMock.mockImplementation((page: number, limit: number) => {
      const start = (page - 1) * limit;
      const slice = all12.slice(start, start + limit);
      return Promise.resolve({
        products: slice,
        total: 12,
        page,
        limit,
        totalPages: 2,
      });
    });

    const categories = [
      { id: 1, name: "Leather", slug: "leather" },
      { id: 2, name: "Silk", slug: "silk" },
    ];

    renderCatalogue(all12.slice(0, 6), categories);

    // First render uses initialData (no fetch fires). Selecting a category
    // clears initialData, so the new query should forward the categoryId.
    const select = screen.getByLabelText("Filter products by category") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "2" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(1, expect.any(Number), undefined, 2);
    });
  });
});
