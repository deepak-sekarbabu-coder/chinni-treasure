import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/components/cart/CartProvider", () => ({
  useCart: () => ({ getTotal: () => 0 }),
}));

import { useShippingNudge } from "../../../lib/hooks/useShippingNudge";

describe("useShippingNudge", () => {
  beforeEach(() => {
    // Default: mobile viewport so the nudge can show
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 768px)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts hidden with zeroed totals", () => {
    const { result } = renderHook(() => useShippingNudge());
    expect(result.current.show).toBe(false);
    expect(result.current.newTotal).toBe(0);
    expect(result.current.shippingLeft).toBe(0);
  });

  it("shows the popup with correct totals when below threshold", () => {
    const { result } = renderHook(() => useShippingNudge());

    act(() => {
      result.current.trigger(75); // ₹75 item on empty cart
    });

    expect(result.current.show).toBe(true);
    expect(result.current.newTotal).toBe(75);
    expect(result.current.shippingLeft).toBe(524); // 599 - 75
  });

  it("hides the popup when total meets or exceeds threshold", () => {
    const { result } = renderHook(() => useShippingNudge());

    act(() => {
      result.current.trigger(75);
    });
    expect(result.current.show).toBe(true);

    act(() => {
      result.current.trigger(599); // exactly at threshold
    });
    expect(result.current.show).toBe(false);
    expect(result.current.newTotal).toBe(599);
    expect(result.current.shippingLeft).toBe(0);
  });

  it("hides when total exceeds threshold", () => {
    const { result } = renderHook(() => useShippingNudge());

    act(() => {
      result.current.trigger(800);
    });

    expect(result.current.show).toBe(false);
    expect(result.current.newTotal).toBe(800);
    expect(result.current.shippingLeft).toBe(0);
  });

  it("dismiss hides the popup", () => {
    const { result } = renderHook(() => useShippingNudge());

    act(() => {
      result.current.trigger(100);
    });
    expect(result.current.show).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.show).toBe(false);
  });

  it("computes correct totals for a cart with existing items", () => {
    const { result } = renderHook(() => useShippingNudge());

    // Simulate adding to a cart that already has ₹300 worth of items
    act(() => {
      result.current.trigger(375); // 300 existing + 75 new item
    });

    expect(result.current.show).toBe(true);
    expect(result.current.newTotal).toBe(375);
    expect(result.current.shippingLeft).toBe(224); // 599 - 375
  });

  it("handles gift box totals correctly", () => {
    const { result } = renderHook(() => useShippingNudge());

    // Cart: ₹299 product + ₹100 gift box = ₹399
    act(() => {
      result.current.trigger(399);
    });

    expect(result.current.show).toBe(true);
    expect(result.current.newTotal).toBe(399);
    expect(result.current.shippingLeft).toBe(200); // 599 - 399
  });
});
