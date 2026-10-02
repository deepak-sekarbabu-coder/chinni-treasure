import type { Order, TrackOrderResult } from "@/src/lib/api/schemas";
import type { ProductRow } from "./ShippingLabel";

/**
 * The packing-label draft — the editable state of a Packing label at pack
 * time (CONTEXT.md → "Packing label"; docs/adr/ADR-0003-document-line-projections.md).
 *
 * Pure state machine: every function takes a draft and returns the next
 * draft, so the modal holds ONE useState<LabelDraft> and renders. Init, reset
 * and clear each live here exactly once — before this module they were three
 * full enumerations of the same 14 fields inside PrintShippingLabelModal, so
 * every new label field was four edits.
 *
 * The courier name is DERIVED from option + custom text, so the
 * select / custom / name trio can no longer desync (it was three setters
 * kept in step by hand).
 *
 * ADR-0003: the draft owns *edits* only. `ProductRow` stays the label's own
 * flat shape and `products` is deliberately absent from `update(patch)` —
 * rows move through the row ops, which keep the ≥1-row invariant private.
 * No editable variant enters `orderLineViews`.
 */

export type LabelOrder = Partial<Order> & TrackOrderResult;

export interface LabelDraft {
  /** YYYY-MM-DD; defaults to today at init/reset/clear. */
  packDate: string;
  invoiceId: string;
  awbNumber: string;
  paymentAmount: number;
  /** Courier <select> value; "" = the "Select courier..." placeholder. */
  courierOption: string;
  /** Free text, only meaningful when courierOption === "Other". */
  courierCustom: string;
  paymentMode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientPincode: string;
  products: ProductRow[];
}

/** Scalar fields only — `products` is reachable through the row ops. */
export type LabelDraftPatch = Partial<Omit<LabelDraft, "products">>;

/** The blank row an empty label (or a cleared one) always keeps. */
export const EMPTY_PRODUCT_ROW: ProductRow = {
  orderId: "",
  styleCode: "",
  actualPrice: 0,
  sellPrice: 0,
  qty: 1,
};

const DEFAULT_COURIER = "Delhivery Pvt Ltd";
const OTHER_COURIER = "Other";

/** Today as a `type="date"` value (local time). Injectable for tests. */
export function defaultPackDate(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Order items → label rows. The label's own projection (flat rows, compare-at
 * as "actual") — see ADR-0003 for why it deliberately does not use
 * `orderLineViews`. One named home, moved here from the modal unchanged.
 */
export function productsFromOrder(order: LabelOrder): ProductRow[] {
  return order.items && order.items.length > 0
    ? order.items.map((item) => ({
        orderId: item.product?.sku || item.productId || "-",
        styleCode: item.productName,
        actualPrice: item.product?.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : Number(item.unitPrice),
        sellPrice: Number(item.unitPrice),
        qty: item.quantity,
      }))
    : [{ ...EMPTY_PRODUCT_ROW }];
}

/** The draft as opened for an order: order prefill, today's pack date. */
export function draftFromOrder(order: LabelOrder, now?: Date): LabelDraft {
  return {
    packDate: defaultPackDate(now),
    invoiceId: order.orderNumber || "",
    awbNumber: order.trackingId || "",
    paymentAmount: order.totalAmount || 0,
    courierOption: DEFAULT_COURIER,
    courierCustom: "",
    paymentMode: "Prepaid",
    recipientName: order.customerName || "",
    recipientPhone: order.customerPhone || "",
    recipientAddress: [order.addressLine1, order.addressLine2]
      .filter(Boolean)
      .join(", "),
    recipientCity: order.city || "",
    recipientPincode: order.postalCode || "",
    products: productsFromOrder(order),
  };
}

/** Restore the draft from the order — the one reset, replacing the old enumeration. */
export function reset(order: LabelOrder, now?: Date): LabelDraft {
  return draftFromOrder(order, now);
}

/** Empty the label: blank scalars, today's date, one empty row. */
export function clear(now?: Date): LabelDraft {
  return {
    packDate: defaultPackDate(now),
    invoiceId: "",
    awbNumber: "",
    paymentAmount: 0,
    courierOption: "",
    courierCustom: "",
    // "Prepaid" matches the pre-module Clear All behaviour exactly.
    paymentMode: "Prepaid",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    recipientCity: "",
    recipientPincode: "",
    products: [{ ...EMPTY_PRODUCT_ROW }],
  };
}

/** One type-checked entry for every scalar field — not fourteen setters. */
export function update(draft: LabelDraft, patch: LabelDraftPatch): LabelDraft {
  return { ...draft, ...patch };
}

/**
 * Courier <select> moved. Choosing a real courier wipes the custom text
 * (matching the pre-module behaviour, so re-selecting "Other" starts blank);
 * choosing "Other" keeps it. The displayed name is derived — see courierName.
 */
export function selectCourier(draft: LabelDraft, option: string): LabelDraft {
  if (option === OTHER_COURIER) {
    return { ...draft, courierOption: option };
  }
  return { ...draft, courierOption: option, courierCustom: "" };
}

/** Derived label name: the chosen courier, or the custom text under "Other". */
export function courierName(draft: LabelDraft): string {
  return draft.courierOption === OTHER_COURIER
    ? draft.courierCustom
    : draft.courierOption;
}

export function addRow(draft: LabelDraft): LabelDraft {
  return { ...draft, products: [...draft.products, { ...EMPTY_PRODUCT_ROW }] };
}

export function updateRow(
  draft: LabelDraft,
  index: number,
  patch: Partial<ProductRow>,
): LabelDraft {
  if (index < 0 || index >= draft.products.length) return draft;
  return {
    ...draft,
    products: draft.products.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    ),
  };
}

/** Remove a row; the draft never holds zero rows. */
export function removeRow(draft: LabelDraft, index: number): LabelDraft {
  const remaining = draft.products.filter((_, i) => i !== index);
  return {
    ...draft,
    products: remaining.length > 0 ? remaining : [{ ...EMPTY_PRODUCT_ROW }],
  };
}

/** The label's preview date: YYYY-MM-DD → DD/MM/YYYY, junk → placeholder. */
export function displayPackDate(dateStr: string): string {
  if (!dateStr) return "--/--/----";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "--/--/----";
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
}
