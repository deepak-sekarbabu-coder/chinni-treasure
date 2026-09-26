import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AdminCategoriesPanel from "@/src/components/admin/AdminCategoriesPanel";
import type { Category } from "@/src/lib/api/schemas";
import type { CategoryFormState } from "@/src/lib/hooks/useAdminCategoriesController";

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: "Jewellery",
    slug: "jewellery",
    displayOrder: 1,
    isActive: true,
    productCount: 4,
    ...overrides,
  } as Category;
}

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  displayOrder: "",
  isActive: true,
} as unknown as CategoryFormState;

function buildProps(
  categories: Category[],
  overrides: Record<string, unknown> = {},
) {
  return {
    showForm: false,
    formClosing: false,
    form: emptyForm,
    productLoading: false,
    categories,
    categoriesLoading: false,
    deleteConfirm: { open: false, categoryName: "", productCount: 0 },
    loadingCategoryId: null,
    togglePendingId: null,
    onToggleForm: vi.fn(),
    onFormChange: vi.fn(),
    onSave: vi.fn(),
    onEdit: vi.fn(),
    onRequestDelete: vi.fn(),
    onCancelDelete: vi.fn(),
    onConfirmDelete: vi.fn(),
    onToggleActive: vi.fn(),
    ...overrides,
  };
}

describe("AdminCategoriesPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders sortable column headers and rows", () => {
    render(buildPanel([makeCategory(), makeCategory({ id: 2, name: "Silk", slug: "silk", displayOrder: 2 })]));
    const table = within(screen.getByRole("table"));
    for (const header of [/name/i, /slug/i, /order/i, /products/i, /status/i]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(table.getByText("Jewellery")).toBeInTheDocument();
    expect(table.getByText("Silk")).toBeInTheDocument();
  });

  it("search input narrows rows by name and slug", () => {
    render(buildPanel([makeCategory(), makeCategory({ id: 2, name: "Silk", slug: "silk", displayOrder: 2 })]));
    const table = within(screen.getByRole("table"));
    fireEvent.change(screen.getByLabelText("Search categories"), { target: { value: "sil" } });
    expect(table.queryByText("Jewellery")).not.toBeInTheDocument();
    expect(table.getByText("Silk")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search categories"), { target: { value: "jewellery" } });
    expect(table.getByText("Jewellery")).toBeInTheDocument();
    expect(table.queryByText("Silk")).not.toBeInTheDocument();
  });

  it("header click sorts rows client-side by display order", () => {
    const silkFirst = [
      makeCategory({ id: 1, name: "First", displayOrder: 2 }),
      makeCategory({ id: 2, name: "Second", displayOrder: 1 }),
    ];
    render(buildPanel(silkFirst));
    fireEvent.click(screen.getByRole("button", { name: /sort by order/i }));
    const rows = screen.getAllByRole("row");
    // skip index 0 (thead row)
    const bodyText = rows.slice(1).map((r) => r.textContent ?? "");
    expect(bodyText.findIndex((t) => t.includes("Second"))).toBeLessThan(bodyText.findIndex((t) => t.includes("First")));
  });

  it("toggle, edit and delete remain callable", () => {
    const onToggleActive = vi.fn();
    const onEdit = vi.fn();
    const onRequestDelete = vi.fn();
    render(buildPanel([makeCategory()], { onToggleActive, onEdit, onRequestDelete }));
    const table = within(screen.getByRole("table"));
    fireEvent.click(table.getByRole("button", { name: /^disable /i }));
    expect(onToggleActive).toHaveBeenCalled();
    fireEvent.click(table.getByRole("button", { name: /^edit /i }));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(table.getByRole("button", { name: /^delete /i }));
    expect(onRequestDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1, productCount: 4 }));
  });

  it("delete-guard modal still blocks when productCount > 0", () => {
    render(
      buildPanel([makeCategory()], {
        deleteConfirm: { open: true, categoryName: "Jewellery", productCount: 4 },
      }),
    );
    expect(screen.getByText(/still has 4 active product/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: /cannot delete/i });
    expect(confirmBtn).toBeDisabled();
  });
});

function buildPanel(categories: Category[], overrides?: Record<string, unknown>) {
  return <AdminCategoriesPanel {...buildProps(categories, overrides)} />;
}
