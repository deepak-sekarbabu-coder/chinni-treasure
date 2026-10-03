import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const addItem = vi.fn();
const showToast = vi.fn();

vi.mock("@/src/components/cart/CartProvider", () => ({
  useCart: () => ({ addItem }),
}));
vi.mock("@/src/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast }),
}));
vi.mock("@/src/lib/cart-flight", () => ({ launchCartFlight: vi.fn() }));

import { useAddToCart } from "@/src/lib/hooks/useAddToCart";
import type { CatalogueProduct } from "@/src/lib/api/schemas";

const product = {
  id: "p1",
  name: "Gold Necklace",
  price: 2999,
  imageUrl: "/n.jpg",
  stockQuantity: 5,
  category: { name: "Jewellery", slug: "jewellery" },
  allowGiftBoxBundling: true,
} as CatalogueProduct;

const boxes = [{ productId: "b1", name: "Box", quantity: 1, price: 150, image: "" }];

function setup() {
  return renderHook(() => useAddToCart({ triggerShippingNudge: vi.fn() }));
}

describe("useAddToCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addItem.mockReturnValue({ result: "added", newTotal: 100 });
  });

  it("adds once and offers no modal when boxes are already chosen", () => {
    const { result } = setup();

    act(() => result.current.handleAdd(product, { giftBoxes: boxes, quantity: 1 }));

    // The gift-box decision was made by the caller, so no modal is pending.
    expect(result.current.giftBox).toBeNull();
    expect(addItem).toHaveBeenCalledTimes(1);
    expect(addItem.mock.calls[0][0].giftBoxes).toEqual(boxes);
  });

  it("opens the modal for an eligible product when no boxes were passed", () => {
    const { result } = setup();

    act(() => result.current.handleAdd(product, { pressedFrom: null }));

    expect(addItem).not.toHaveBeenCalled();
    expect(result.current.giftBox).not.toBeNull();
  });

  // The detail page's path: N units, and the customer's boxes ride on the
  // first one only rather than being added N times over.
  it("adds quantity units with boxes on the first only", () => {
    const { result } = setup();

    act(() => result.current.handleAdd(product, { giftBoxes: boxes, quantity: 3 }));

    expect(addItem).toHaveBeenCalledTimes(3);
    expect(addItem.mock.calls.map((c) => c[0].giftBoxes)).toEqual([boxes, undefined, undefined]);
  });

  it("stops at the first refused unit and never flies an item that did not land", () => {
    addItem
      .mockReturnValueOnce({ result: "added", newTotal: 10 })
      .mockReturnValueOnce({ result: "max_one", newTotal: 10 });
    const triggerShippingNudge = vi.fn();
    const { result } = renderHook(() => useAddToCart({ triggerShippingNudge }));

    act(() => result.current.handleAdd(product, { giftBoxes: boxes, quantity: 3 }));

    expect(addItem).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith("Max 1 Qty per user for Gold Necklace", "info");
    expect(triggerShippingNudge).not.toHaveBeenCalled();
  });
});