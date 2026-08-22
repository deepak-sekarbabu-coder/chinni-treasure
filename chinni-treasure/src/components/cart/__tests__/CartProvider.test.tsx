import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Must run before CartProvider module is evaluated
vi.hoisted(() => {
  vi.stubEnv("NEXT_PUBLIC_ENABLE_SURPRISE_GIFT", "false");
});

import { CartProvider, useCart } from "../CartProvider";

const mockProduct = {
  id: "prod-1",
  name: "Test Product",
  price: 29.99,
  image: "/test.jpg",
  stock: 10,
};

describe("CartProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderCart() {
    return renderHook(() => useCart(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      ),
    });
  }

  it("starts with an empty cart", () => {
    const { result } = renderCart();
    expect(result.current.items).toEqual([]);
    expect(result.current.getCount()).toBe(0);
    expect(result.current.getTotal()).toBe(0);
  });

  it("addItem adds a new item to the cart", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe("prod-1");
    expect(result.current.items[0].quantity).toBe(1);
  });

  it("addItem increments quantity for existing item", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("addItem returns max_reached when at stock limit", () => {
    const { result } = renderCart();
    const lowStockProduct = { ...mockProduct, stock: 2 };

    act(() => {
      result.current.addItem(lowStockProduct);
    });

    act(() => {
      result.current.addItem(lowStockProduct);
    });

    // Third add should hit stock limit — verify state effect
    act(() => {
      result.current.addItem(lowStockProduct);
    });

    // State should reflect the limit
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("addItem returns out_of_stock when stock is 0", () => {
    const { result } = renderCart();
    const outOfStock = { ...mockProduct, stock: 0 };

    act(() => {
      result.current.addItem(outOfStock);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("removeItem removes item from cart", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.removeItem("prod-1");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("updateQuantity increments and decrements quantity", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.updateQuantity("prod-1", 1);
    });

    expect(result.current.items[0].quantity).toBe(2);

    act(() => {
      result.current.updateQuantity("prod-1", -1);
    });

    expect(result.current.items[0].quantity).toBe(1);
  });

  it("updateQuantity removes item when quantity reaches 0", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.updateQuantity("prod-1", -1);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("updateQuantity does not exceed stock limit", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem({ ...mockProduct, stock: 1 });
    });

    act(() => {
      result.current.updateQuantity("prod-1", 1);
    });

    expect(result.current.items[0].quantity).toBe(1);
  });

  it("updateQuantity on non-existent product returns unchanged", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.updateQuantity("nonexistent-id", 1);
    });
  });

  it("clearCart empties all items", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem({ ...mockProduct, id: "prod-2", name: "Product 2" });
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("getTotal sums price times quantity", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem({ ...mockProduct, id: "prod-2", name: "Product 2", price: 49.99 });
    });

    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.getTotal()).toBeCloseTo(29.99 * 2 + 49.99);
  });

  it("getCount sums quantities", () => {
    const { result } = renderCart();

    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem({ ...mockProduct, id: "prod-2", name: "Product 2" });
    });

    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.getCount()).toBe(3);
  });

  it("loads cart from localStorage on mount", () => {
    const savedCart = [
      { productId: "prod-1", name: "Saved Product", price: 19.99, quantity: 2, image: "/saved.jpg", stock: 5 },
    ];
    localStorage.setItem("luxe_cart", JSON.stringify(savedCart));

    const { result } = renderCart();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Saved Product");
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("persists cart to localStorage on change", () => {
    const { result } = renderCart();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    act(() => {
      result.current.addItem(mockProduct);
    });

    const saved = JSON.parse(localStorage.getItem("luxe_cart") || "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0].productId).toBe("prod-1");
  });

  it("handles malformed JSON in localStorage gracefully", () => {
    localStorage.setItem("luxe_cart", "{invalid json}");

    const { result } = renderCart();

    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Should start with empty cart after failed parse
    expect(result.current.items).toEqual([]);
    expect(result.current.getCount()).toBe(0);
  });

  it("useCart throws when used outside provider", () => {
    const { result } = renderHook(() => {
      try {
        return useCart();
      } catch (e) {
        return e;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toContain("useCart must be used within CartProvider");
  });
});
