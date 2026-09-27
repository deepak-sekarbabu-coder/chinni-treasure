import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AdminCataloguePanel from "@/src/components/admin/AdminCataloguePanel";
import type {
  CataloguePanelActions,
  CataloguePanelData,
  CataloguePanelViewModel,
} from "@/src/components/admin/useAdminCataloguePanel";
import type { ProductFormData } from "@/src/types";
import type { Category, Product } from "@/src/lib/api/schemas";

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

const baseData: CataloguePanelData = {
  products: [product],
  productTotalPages: 1,
  categories: [],
  categoriesLoading: false,
  filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "newest" },
  currentPage: 1,
  showForm: false,
  formClosing: false,
  productForm: emptyForm,
  deleteConfirm: { open: false, productId: "", productName: "" },
  loadingProductId: null,
};

function panel(
  data: Partial<CataloguePanelData> = {},
  actions: Partial<CataloguePanelActions> = {},
): CataloguePanelViewModel {
  return {
    data: { ...baseData, ...data },
    loading: false,
    formSaving: false,
    actions: {
      onPageChange: vi.fn(),
      onFilterChange: vi.fn(),
      onFilterReset: vi.fn(),
      onToggleForm: vi.fn(),
      onFormChange: vi.fn(),
      onSave: vi.fn(),
      onEdit: vi.fn(),
      onRequestDelete: vi.fn(),
      onCancelDelete: vi.fn(),
      onConfirmDelete: vi.fn(),
      ...actions,
    },
  };
}

describe("AdminCataloguePanel header sorting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clicking the Price header reports price-asc then price-desc", () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(<AdminCataloguePanel panel={panel({}, { onFilterChange })} />);

    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenCalledWith({ sort: "price-asc" });

    // Parent state flips filters.sort to "price-asc"; re-render with it.
    rerender(
      <AdminCataloguePanel
        panel={panel(
          { filters: { search: "", categoryId: "", badge: "all", status: "all", sort: "price-asc" } },
          { onFilterChange },
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /sort by price/i }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ sort: "price-desc" });
  });

  it("renders rows via column cells and keeps pagination bar", () => {
    render(<AdminCataloguePanel panel={panel()} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Silk Scarf")).toBeInTheDocument();
    expect(screen.queryByText(/page 1 of 1/i)).not.toBeInTheDocument(); // PaginationBar hides at 1 page
  });
});

describe("AdminCataloguePanel gift-box bundling lock", () => {
  const giftBox = { id: 1, name: "Gift Boxes", slug: "box" } as unknown as Category;
  const bundlingOn = { ...emptyForm, categoryId: "1", allowGiftBoxBundling: true };

  beforeEach(() => vi.clearAllMocks());

  it("clears a true bundling flag the server would reject for a Gift Box product", () => {
    const onFormChange = vi.fn();
    render(
      <AdminCataloguePanel
        panel={panel({ showForm: true, categories: [giftBox], productForm: bundlingOn }, { onFormChange })}
      />,
    );

    // Locked, so the flag can never be unticked by hand...
    const toggle = screen.getByRole("checkbox", { name: /enabled|disabled/i });
    expect(toggle).toBeDisabled();
    // ...which is why the modal reconciles the value instead of dead-ending the save.
    expect(onFormChange).toHaveBeenCalledWith({ ...bundlingOn, allowGiftBoxBundling: false });
  });

  it("leaves bundling alone when the category is not Gift Boxes", () => {
    const onFormChange = vi.fn();
    render(
      <AdminCataloguePanel
        panel={panel({ showForm: true, categories: [giftBox], productForm: { ...emptyForm, categoryId: "2" } }, { onFormChange })}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /enabled|disabled/i })).toBeEnabled();
    expect(onFormChange).not.toHaveBeenCalled();
  });
});
