import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/lib/hooks/useAdminMutations", () => ({
  useCreateProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
  useDeleteProduct: vi.fn(),
}));

vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "@/src/lib/hooks/useAdminMutations";
import { useAdminCatalogueController } from "../useAdminCatalogueController";

const mockUseCreateProduct = vi.mocked(useCreateProduct);
const mockUseUpdateProduct = vi.mocked(useUpdateProduct);
const mockUseDeleteProduct = vi.mocked(useDeleteProduct);

function makeMutation(overrides: Partial<{ isPending: boolean; mutateAsync: ReturnType<typeof vi.fn> }> = {}) {
  return {
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as ReturnType<typeof useCreateProduct>;
}

const sampleProduct = {
  id: "prod-1",
  name: "Sample",
  price: 10,
  imageUrl: "/x.jpg",
  description: "desc",
  stockQuantity: 5,
  badge: null,
  category: null,
  categoryId: null,
  sku: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("useAdminCatalogueController", () => {
  beforeEach(() => {
    mockUseCreateProduct.mockReturnValue(makeMutation());
    mockUseUpdateProduct.mockReturnValue(makeMutation());
    mockUseDeleteProduct.mockReturnValue(makeMutation());
  });

  it("opens the form when toggled from closed state", () => {
    const { result } = renderHook(() => useAdminCatalogueController());

    act(() => {
      result.current.toggleProductForm();
    });

    expect(result.current.showProductForm).toBe(true);
    expect(result.current.productForm.name).toBe("");
  });

  it("prefills the form when editing a product", () => {
    const { result } = renderHook(() => useAdminCatalogueController());

    act(() => {
      result.current.editProduct(sampleProduct);
    });

    expect(result.current.showProductForm).toBe(true);
    expect(result.current.productForm.id).toBe("prod-1");
    expect(result.current.productForm.name).toBe("Sample");
    expect(result.current.productForm.price).toBe("10");
  });

  it("invokes onAfterSave and closes the form after a successful create", async () => {
    vi.useFakeTimers();
    const onAfterSave = vi.fn();
    const { result } = renderHook(() =>
      useAdminCatalogueController({ onAfterSave }),
    );

    act(() => {
      result.current.toggleProductForm();
    });
    act(() => {
      result.current.onFormChange({
        ...result.current.productForm,
        name: "New",
        price: "5",
      });
    });

    await act(async () => {
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleProductSave(event);
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onAfterSave).toHaveBeenCalledTimes(1);
    expect(result.current.showProductForm).toBe(false);

    vi.useRealTimers();
  });

  it("confirms deletion and clears the modal", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseDeleteProduct.mockReturnValue(makeMutation({ mutateAsync }));

    const { result } = renderHook(() => useAdminCatalogueController());

    act(() => {
      result.current.requestProductDelete(sampleProduct);
    });
    expect(result.current.deleteConfirm.open).toBe(true);

    await act(async () => {
      await result.current.handleProductDeleteConfirmed();
    });

    expect(mutateAsync).toHaveBeenCalledWith("prod-1");
    expect(result.current.deleteConfirm.open).toBe(false);
  });
});
