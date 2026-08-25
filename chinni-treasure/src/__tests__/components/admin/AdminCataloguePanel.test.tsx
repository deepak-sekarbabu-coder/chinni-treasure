import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminCataloguePanel, {
  type ProductFormData,
} from "@/src/components/admin/AdminCataloguePanel";
import type { Product } from "@/src/lib/api/schemas";

const emptyForm: ProductFormData = {
  id: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "",
  imageUrl: "",
  badge: "",
  categoryId: "",
  isActive: true,
  allowGiftBoxBundling: false,
  visibleHostnames: "",
  images: [],
};

const product = {
  id: "p1",
  name: "Silk Scarf",
  price: 1000,
  compareAtPrice: null,
  imageUrl: null,
  description: null,
  stockQuantity: 5,
  badge: null,
  category: { name: "Silk" },
  categoryId: 1,
  sku: "SILK-1",
  isActive: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  images: [],
} as unknown as Product;

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    showForm: false,
    formClosing: false,
    productForm: emptyForm,
    productLoading: false,
    products: [product],
    productsLoading: false,
    loadingProductId: null,
    productPage: 1,
    productTotalPages: 1,
    categories: [],
    categoriesLoading: false,
    filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "newest" },
    onFilterChange: vi.fn(),
    onFilterReset: vi.fn(),
    onToggleForm: vi.fn(),
    onFormChange: vi.fn(),
    onSave: vi.fn(),
    onEdit: vi.fn(),
    onRequestDelete: vi.fn(),
    onPageChange: vi.fn(),
    ...overrides,
  };
}

describe("AdminCataloguePanel header sorting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clicking the Price header reports price-asc then price-desc", () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(<AdminCataloguePanel {...buildProps({ onFilterChange })} />);

    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenCalledWith({ sort: "price-asc" });

    // Parent state flips filters.sort to "price-asc"; re-render with it.
    rerender(
      <AdminCataloguePanel
        {...buildProps({
          onFilterChange,
          filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "price-asc" },
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ sort: "price-desc" });
  });

  it("renders rows via column cells and keeps pagination bar", () => {
    render(<AdminCataloguePanel {...buildProps()} />);
    expect(screen.getByText("Silk Scarf")).toBeInTheDocument();
    expect(screen.queryByText(/page 1 of 1/i)).not.toBeInTheDocument(); // PaginationBar hides at 1 page
  });
});
