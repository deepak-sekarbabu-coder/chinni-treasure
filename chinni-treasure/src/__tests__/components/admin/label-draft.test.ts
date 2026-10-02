import { describe, it, expect } from "vitest";
import {
  EMPTY_PRODUCT_ROW,
  addRow,
  clear,
  courierName,
  defaultPackDate,
  displayPackDate,
  draftFromOrder,
  productsFromOrder,
  removeRow,
  reset,
  selectCourier,
  update,
  updateRow,
  type LabelDraft,
  type LabelOrder,
} from "@/src/components/admin/label-draft";

/** Fixed clock: 29 September 2026, local time. */
const NOW = new Date(2026, 8, 29);

const order: LabelOrder = {
  id: "order-1",
  orderNumber: "CH20260929",
  customerName: "Priya",
  customerEmail: "priya@example.com",
  customerPhone: "9876543210",
  status: "packaging",
  totalAmount: 1499,
  subtotal: 1299,
  shippingCost: 200,
  createdAt: "2026-09-29T10:00:00.000Z",
  trackingId: "TRK123",
  addressLine1: "12 MG Road",
  addressLine2: "Flat 4B",
  city: "Chennai",
  stateCode: "TN",
  postalCode: "600001",
  items: [
    {
      id: "i1",
      productName: "Silk Saree",
      unitPrice: 999,
      quantity: 1,
      productId: "p1",
      product: { sku: "SKU1", compareAtPrice: 1499 },
    },
    { id: "i2", productName: "Gift Box", unitPrice: 300, quantity: 2 },
  ],
};

const draft = (): LabelDraft => draftFromOrder(order, NOW);

describe("draftFromOrder", () => {
  it("prefills every field from the order", () => {
    expect(draft()).toEqual({
      packDate: "2026-09-29",
      invoiceId: "CH20260929",
      awbNumber: "TRK123",
      paymentAmount: 1499,
      courierOption: "Delhivery Pvt Ltd",
      courierCustom: "",
      paymentMode: "Prepaid",
      recipientName: "Priya",
      recipientPhone: "9876543210",
      recipientAddress: "12 MG Road, Flat 4B",
      recipientCity: "Chennai",
      recipientPincode: "600001",
      products: [
        {
          orderId: "SKU1",
          styleCode: "Silk Saree",
          actualPrice: 1499,
          sellPrice: 999,
          qty: 1,
        },
        {
          orderId: "-",
          styleCode: "Gift Box",
          actualPrice: 300,
          sellPrice: 300,
          qty: 2,
        },
      ],
    });
  });

  it("falls back to blanks for a sparse order", () => {
    const d = draftFromOrder({}, NOW);
    expect(d.invoiceId).toBe("");
    expect(d.awbNumber).toBe("");
    expect(d.paymentAmount).toBe(0);
    expect(d.recipientName).toBe("");
    expect(d.recipientAddress).toBe("");
    expect(d.products).toEqual([EMPTY_PRODUCT_ROW]);
  });
});

describe("productsFromOrder", () => {
  it("keeps the ADR-0003 flat projection: compare-at as actual", () => {
    const rows = productsFromOrder(order);
    expect(rows).toHaveLength(2);
    expect(rows[0].actualPrice).toBe(1499);
    expect(rows[0].sellPrice).toBe(999);
    expect(rows[1].orderId).toBe("-");
  });

  it("returns one empty row when the order has no items", () => {
    expect(productsFromOrder({ items: [] })).toEqual([EMPTY_PRODUCT_ROW]);
    expect(productsFromOrder({})).toEqual([EMPTY_PRODUCT_ROW]);
  });
});

describe("reset / clear", () => {
  it("reset restores the order prefill in one home", () => {
    const edited = update(draft(), {
      invoiceId: "EDITED",
      paymentAmount: 1,
      recipientCity: "Coimbatore",
    });
    expect(reset(order, NOW)).toEqual(draftFromOrder(order, NOW));
    expect(reset(order, NOW)).not.toEqual(edited);
  });

  it("clear blanks every scalar, keeps a default date and one row", () => {
    const d = clear(NOW);
    expect(d).toEqual({
      packDate: "2026-09-29",
      invoiceId: "",
      awbNumber: "",
      paymentAmount: 0,
      courierOption: "",
      courierCustom: "",
      paymentMode: "Prepaid",
      recipientName: "",
      recipientPhone: "",
      recipientAddress: "",
      recipientCity: "",
      recipientPincode: "",
      products: [EMPTY_PRODUCT_ROW],
    });
  });
});

describe("update", () => {
  it("patches scalar fields without touching the rest", () => {
    const d = draft();
    const next = update(d, { awbNumber: "NEW-AWB", paymentAmount: 50 });
    expect(next.awbNumber).toBe("NEW-AWB");
    expect(next.paymentAmount).toBe(50);
    expect(next.invoiceId).toBe(d.invoiceId);
    expect(next.products).toBe(d.products);
  });
});

describe("courier derivation", () => {
  it("derives the name from the chosen option", () => {
    expect(courierName(draft())).toBe("Delhivery Pvt Ltd");
    expect(courierName(selectCourier(draft(), "Blue Dart Express"))).toBe(
      "Blue Dart Express",
    );
  });

  it("uses the custom text only under Other", () => {
    const customised = update(selectCourier(draft(), "Other"), {
      courierCustom: "Local Courier Co",
    });
    expect(courierName(customised)).toBe("Local Courier Co");
    expect(courierName(selectCourier(draft(), "Other"))).toBe("");
    expect(courierName(clear(NOW))).toBe("");
  });

  it("switching to a real courier wipes the custom text", () => {
    const customised = update(selectCourier(draft(), "Other"), {
      courierCustom: "Local Courier Co",
    });
    const switched = selectCourier(customised, "FedEx India");
    expect(switched.courierOption).toBe("FedEx India");
    expect(switched.courierCustom).toBe("");
    // Re-selecting Other starts blank, exactly like the pre-module behaviour.
    expect(courierName(selectCourier(switched, "Other"))).toBe("");
  });
});

describe("row ops", () => {
  it("addRow appends a fresh empty row", () => {
    const d = addRow(draft());
    expect(d.products).toHaveLength(3);
    expect(d.products[2]).toEqual(EMPTY_PRODUCT_ROW);
    expect(d.products[2]).not.toBe(d.products[0]);
  });

  it("updateRow patches one row and ignores out-of-range indices", () => {
    const d = draft();
    const patched = updateRow(d, 1, { qty: 5, styleCode: "Renamed" });
    expect(patched.products[1]).toEqual({
      orderId: "-",
      styleCode: "Renamed",
      actualPrice: 300,
      sellPrice: 300,
      qty: 5,
    });
    expect(patched.products[0]).toBe(d.products[0]);
    expect(updateRow(d, 99, { qty: 9 })).toBe(d);
    expect(updateRow(d, -1, { qty: 9 })).toBe(d);
  });

  it("removeRow never empties the draft", () => {
    const two = removeRow(draft(), 0);
    expect(two.products).toHaveLength(1);
    const zero = removeRow(two, 0);
    expect(zero.products).toEqual([EMPTY_PRODUCT_ROW]);
  });
});

describe("dates", () => {
  it("defaultPackDate formats local YYYY-MM-DD", () => {
    expect(defaultPackDate(NOW)).toBe("2026-09-29");
    expect(defaultPackDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("displayPackDate shows DD/MM/YYYY with a placeholder fallback", () => {
    expect(displayPackDate("2026-09-29")).toBe("29/09/2026");
    expect(displayPackDate("")).toBe("--/--/----");
    expect(displayPackDate("junk")).toBe("--/--/----");
    expect(displayPackDate("2026-09")).toBe("--/--/----");
  });
});
