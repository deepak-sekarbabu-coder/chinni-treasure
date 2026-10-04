import { describe, it, expect } from "vitest";
import {
  canAddBoxes,
  selectedBoxCount,
  stepBox,
  toggleBox,
  type GiftBox,
  type SelectedGiftBox,
} from "@/src/components/pages/gift-box-picker";

const boxA: GiftBox = { id: "a", name: "Box A", price: 150, imageUrl: "/a.jpg", stockQuantity: 5 };
const boxB: GiftBox = { id: "b", name: "Box B", price: 75, imageUrl: null, stockQuantity: 5 };
const line = (productId: string, quantity: number): SelectedGiftBox => ({
  productId,
  name: productId.toUpperCase(),
  price: 100,
  image: "",
  quantity,
});

describe("gift-box selection", () => {
  it("counts box units, not lines", () => {
    expect(selectedBoxCount([line("a", 1), line("b", 3)])).toBe(4);
    expect(canAddBoxes([line("a", 1)], 2)).toBe(true);
    expect(canAddBoxes([line("a", 2)], 2)).toBe(false);
  });

  it("toggles a box on and off", () => {
    const on = toggleBox([], boxA, 4);
    expect(on).toEqual([
      { productId: "a", name: "Box A", price: 150, image: "/a.jpg", quantity: 1 },
    ]);
    expect(toggleBox(on, boxA, 4)).toEqual([]);
  });

  it("falls back to an empty image when a box has none", () => {
    expect(toggleBox([], boxB, 4)[0].image).toBe("");
  });

  it("drops a line stepped to zero", () => {
    expect(stepBox([line("a", 1)], "a", -1, 4)).toEqual([]);
  });

  it("leaves other lines alone when one is stepped", () => {
    expect(stepBox([line("a", 1), line("b", 2)], "a", 1, 4)).toEqual([line("a", 2), line("b", 2)]);
  });

  it("never steps past the cap", () => {
    expect(stepBox([line("a", 2)], "a", 1, 2)).toEqual([line("a", 2)]);
  });

  it("trims the whole selection down to the cap, keeping the newest line", () => {
    // The detail page's rule: one parent, one box unit.
    expect(toggleBox([line("a", 1)], boxB, 1)).toEqual([
      { productId: "b", name: "Box B", price: 75, image: "", quantity: 1 },
    ]);
  });

  it("leaves the selection uncapped when the cap is unbounded (the modal's rule)", () => {
    const uncapped = Number.POSITIVE_INFINITY;
    const start = toggleBox([], boxA, uncapped);
    expect(stepBox(start, "a", 5, uncapped)).toEqual([{ ...start[0], quantity: 6 }]);
  });
});