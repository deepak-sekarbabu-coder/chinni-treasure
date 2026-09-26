import { describe, it, expect } from "vitest";
import {
  ORDER_STATUS_ACTIONS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VOCABULARY,
  ORDER_STATUS_ICONS,
  INDIAN_STATES,
  nextOrderStatus,
} from "../../lib/constants";


describe("ORDER_STATUS_FLOW", () => {
  it("contains statuses in the correct order", () => {
    expect(ORDER_STATUS_FLOW).toEqual([
      "pending",
      "approved",
      "packaging",
      "shipped",
      "delivered",
    ]);
  });

  it("does not include rejected", () => {
    expect(ORDER_STATUS_FLOW).not.toContain("rejected");
  });

  describe("nextOrderStatus", () => {
    it("returns the next step of the forward flow", () => {
      expect(nextOrderStatus("pending")).toBe("approved");
      expect(nextOrderStatus("approved")).toBe("packaging");
      expect(nextOrderStatus("packaging")).toBe("shipped");
      expect(nextOrderStatus("shipped")).toBe("delivered");
    });

    it("returns null for terminal, rejected, and unknown statuses", () => {
    expect(nextOrderStatus("delivered")).toBeNull();
    expect(nextOrderStatus("rejected")).toBeNull();

    expect(ORDER_STATUS_ACTIONS["pending"]).toEqual(["approved", "rejected"]);
    expect(ORDER_STATUS_ACTIONS["packaging"]).toEqual(["shipped", "rejected"]);
    expect(ORDER_STATUS_ACTIONS["shipped"]).toEqual(["delivered", "rejected"]);
      expect(nextOrderStatus("flying")).toBeNull();
    });
  });
});

describe("ORDER_STATUS_LABELS", () => {
  it("has a label for every vocabulary status", () => {
    for (const status of ORDER_STATUS_VOCABULARY.flow) {
      expect(ORDER_STATUS_LABELS[status]).toBeDefined();
      expect(typeof ORDER_STATUS_LABELS[status]).toBe("string");
    }
    expect(ORDER_STATUS_LABELS["rejected"]).toBeDefined();
  });
});

describe("ORDER_STATUS_ICONS", () => {
  it("has an icon for every vocabulary status", () => {
    for (const status of ORDER_STATUS_VOCABULARY.flow) {
      expect(ORDER_STATUS_ICONS[status]).toBeDefined();
    }
    expect(ORDER_STATUS_ICONS["rejected"]).toBeDefined();
  });
});

describe("INDIAN_STATES", () => {
  it("has 36 state/UT entries", () => {
    expect(INDIAN_STATES).toHaveLength(36);
  });

  it("has expected state codes", () => {
    const codes = INDIAN_STATES.map((s) => s.code);
    expect(codes).toContain("MH"); // Maharashtra
    expect(codes).toContain("DL"); // Delhi
    expect(codes).toContain("KA"); // Karnataka
    expect(codes).toContain("TN"); // Tamil Nadu
  });

  it("has non-empty names for all entries", () => {
    for (const state of INDIAN_STATES) {
      expect(state.name).toBeTruthy();
    }
  });
});
