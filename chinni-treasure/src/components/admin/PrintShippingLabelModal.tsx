"use client";

import { useState } from "react";
import type { Order, TrackOrderResult } from "@/src/lib/api/schemas";
import Modal from "@/src/components/ui/Modal";
import ShippingLabel, { type ProductRow } from "./ShippingLabel";
import {
  addRow,
  clear,
  courierName,
  displayPackDate,
  draftFromOrder,
  removeRow,
  reset,
  selectCourier,
  update,
  updateRow,
  type LabelDraft,
  type LabelDraftPatch,
} from "./label-draft";

interface Props {
  order: Partial<Order> & TrackOrderResult;
  isOpen: boolean;
  onClose: () => void;
}

const COURIER_OPTIONS = [
  "Delhivery Pvt Ltd",
  "Blue Dart Express",
  "DTDC Express",
  "FedEx India",
  "India Post",
  "Ekart Logistics",
  "Xpress Bees",
  "Ecom Express",
  "Shadowfax",
  "Other",
];

// EMPTY_PRODUCT_ROW and productsFromOrder (the label's ADR-0003 projection)
// moved to ./label-draft.ts — one home, together with every field rule.

/** True when `selectorText` can match the print label — see `collectLabelCSS`. */
function appliesToLabel(selectorText: string, classes: Set<string>): boolean {
  const named = Array.from(selectorText.matchAll(/\.([\w-]+)/g), (match) => match[1]);
  // The print window holds the label's subtree and nothing else, so a rule that
  // names a class the label does not render cannot match there: it needs an
  // ancestor or a descendant that isn't in the window. Every named class being
  // one the label uses is therefore both necessary and sufficient — and it is
  // what the old substring test got wrong in both directions, matching
  // `.docs-content .swagger-ui .info .title` on its mention of `.title` while
  // missing any label class that never made it into the hand-copied list.
  return named.length > 0 && named.every((cls) => classes.has(cls));
}

/**
 * Copy the app's label CSS into the print window, which gets only the label's
 * markup and no stylesheets.
 *
 * The set of classes is read off the rendered label rather than restated as a
 * 38-name allowlist, so a class added to ShippingLabel.tsx is picked up
 * automatically and a stale name in the list can never go on matching.
 */
export function collectLabelCSS(
  labelEl: HTMLElement,
  sheets: ArrayLike<CSSStyleSheet>,
): string {
  const used = new Set<string>();
  for (const el of [labelEl, ...labelEl.querySelectorAll("*")]) {
    for (const cls of el.classList) used.add(cls);
  }

  const rules: string[] = [];
  for (const sheet of Array.from(sheets)) {
    let cssRules: CSSRuleList | undefined;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet — not readable, and not ours
    }
    for (const rule of Array.from(cssRules)) {
      if (rule instanceof CSSStyleRule && appliesToLabel(rule.selectorText, used)) {
        rules.push(rule.cssText);
      }
    }
  }
  return rules.join("\n");
}

export default function PrintShippingLabelModal({ order, isOpen, onClose }: Props) {
  // One draft, one state — init/reset/clear, the courier sync rule, the date
  // defaults and the row invariants all live in ./label-draft.ts (CONTEXT.md →
  // Packing label). The JSX only reads the draft and calls ops.
  const [draft, setDraft] = useState<LabelDraft>(() => draftFromOrder(order));
  const edit = (patch: LabelDraftPatch) => setDraft((d) => update(d, patch));

  const resetToOrderData = () => setDraft(reset(order));
  const clearAllData = () => setDraft(clear());

  // Print the label in a new popup window containing only the label content
  const handlePrint = () => {
    const labelEl = document.getElementById("labelContainer");
    if (!labelEl) return;

    const labelHTML = labelEl.innerHTML;
    const labelCSS = collectLabelCSS(labelEl, document.styleSheets);

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the label.");
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Shipping Label</title>
<style>
  @page {
    size: 4in 6in;
    margin: 0;
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* The label's own rules (app/styles/admin.css) follow, copied by
     collectLabelCSS. .label-container among them: labelEl.innerHTML drops the
     root's attributes, so the sizing has to arrive as a rule — but the
     stylesheet is that rule's one home, not a restatement here. */
  ${labelCSS}
</style>
</head>
<body>
${labelHTML}
</body>
</html>`);
    printWindow.document.close();
    // Wait for images / barcode SVG to render before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // The Modal module renders nothing when closed.

  // Row ops — the ≥1-row invariant stays behind the draft interface.
  const handleProductChange = (index: number, key: keyof ProductRow, val: string | number) => {
    setDraft((d) => updateRow(d, index, { [key]: val } as Partial<ProductRow>));
  };

  const addProductRow = () => setDraft((d) => addRow(d));
  const removeProductRow = (index: number) => setDraft((d) => removeRow(d, index));

  const labelContent = (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy="shipping-label-editor-title"
      // The editor is deliberately dismissed only by its own Close button —
      // an operator mid-label shouldn't lose a half-typed AWB to a stray key.
      // It still sits on the Modal stack, so the parent modal stands down.
      closeOnEscape={false}
      overlayClassName="modal-overlay active print-label-overlay-active"
      contentClassName="print-label-modal-box"
    >
        {/* Left Side: Editor Form */}
        <div
          className="print-label-editor-panel"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2
              id="shipping-label-editor-title"
              style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-dark)" }}
            >
              Shipping Label Editor
            </h2>
            <button
              onClick={onClose}
              aria-label="Close shipping label editor"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Section 1: Order & Shipment Info */}
          <div className="form-section">
            <div className="section-title">📦 Order & Shipment Info</div>
            <div className="control-row">
              <div className="control-group">
                <label>Packaging Date</label>
                <input
                  type="date"
                  value={draft.packDate}
                  onChange={(e) => edit({ packDate: e.target.value })}
                />
              </div>
              <div className="control-group">
                <label>Invoice ID</label>
                <input
                  type="text"
                  value={draft.invoiceId}
                  onChange={(e) => edit({ invoiceId: e.target.value })}
                  placeholder="e.g. CH20260701"
                />
              </div>
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>AWB Number</label>
                <input
                  type="text"
                  value={draft.awbNumber}
                  onChange={(e) => edit({ awbNumber: e.target.value })}
                  placeholder="Enter AWB / Tracking number"
                />
              </div>
              <div className="control-group">
                <label>Payment Amount (₹)</label>
                <input
                  type="number"
                  value={draft.paymentAmount}
                  onChange={(e) => edit({ paymentAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Courier Details */}
          <div className="form-section">
            <div className="section-title">🚚 Courier Details</div>
            <div className="control-row">
              <div className="control-group">
                <label>Courier Name</label>
                <select
                  value={draft.courierOption}
                  onChange={(e) => setDraft((d) => selectCourier(d, e.target.value))}
                >
                  <option value="">Select courier...</option>
                  {COURIER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {draft.courierOption === "Other" && (
                  <input
                    type="text"
                    value={draft.courierCustom}
                    onChange={(e) => edit({ courierCustom: e.target.value })}
                    placeholder="Enter courier name"
                    style={{ marginTop: "6px" }}
                  />
                )}
              </div>
              <div className="control-group">
                <label>Payment Mode</label>
                <select
                  value={draft.paymentMode}
                  onChange={(e) => edit({ paymentMode: e.target.value })}
                >
                  <option value="Prepaid">Prepaid</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="UPI">UPI / Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Recipient Address */}
          <div className="form-section">
            <div className="section-title">📍 Ship To (Recipient)</div>
            <div className="control-row">
              <div className="control-group">
                <label>Receiver Name</label>
                <input
                  type="text"
                  value={draft.recipientName}
                  onChange={(e) => edit({ recipientName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="control-group">
                <label>Receiver Phone</label>
                <input
                  type="text"
                  value={draft.recipientPhone}
                  onChange={(e) => edit({ recipientPhone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="control-group">
              <label>Address</label>
              <textarea                  value={draft.recipientAddress}
                  onChange={(e) => edit({ recipientAddress: e.target.value })}
                placeholder="Street, Locality, Landmark"
              />
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>City</label>
                <input
                  type="text"
                  value={draft.recipientCity}
                  onChange={(e) => edit({ recipientCity: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="control-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={draft.recipientPincode}
                  onChange={(e) => edit({ recipientPincode: e.target.value })}
                  placeholder="6 digit pincode"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Product Details */}
          <div className="form-section">
            <div className="section-title">🛍 Product Details</div>
            <div>
              {draft.products.map((p, idx) => (
                <div key={idx} className="product-entry" style={{ position: "relative" }}>
                  {draft.products.length > 1 && (
                    <button
                      className="btn-remove"
                      onClick={() => removeProductRow(idx)}
                      style={{ position: "absolute", top: "10px", right: "10px" }}
                    >
                      ✕ Remove
                    </button>
                  )}
                  <div className="control-row">
                    <div className="control-group">
                      <label>Product Code</label>
                      <input
                        type="text"
                        value={p.orderId}
                        onChange={(e) => handleProductChange(idx, "orderId", e.target.value)}
                        placeholder="SKU / ID"
                      />
                    </div>
                    <div className="control-group">
                      <label>Product Description</label>
                      <input
                        type="text"
                        value={p.styleCode}
                        onChange={(e) => handleProductChange(idx, "styleCode", e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                  <div className="control-row">
                    <div className="control-group">
                      <label>Actual Price (₹)</label>
                      <input
                        type="number"
                        value={p.actualPrice}
                        onChange={(e) => handleProductChange(idx, "actualPrice", Number(e.target.value))}
                        step="0.01"
                      />
                    </div>
                    <div className="control-group">
                      <label>Sell Price (₹)</label>
                      <input
                        type="number"
                        value={p.sellPrice}
                        onChange={(e) => handleProductChange(idx, "sellPrice", Number(e.target.value))}
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="control-row">
                    <div className="control-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={p.qty}
                        onChange={(e) => handleProductChange(idx, "qty", Number(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "10px" }}>
              <button
                className="btn btn-secondary"
                onClick={addProductRow}
                style={{ fontSize: "13px", padding: "7px 14px" }}
              >
                ➕ Add Another Product
              </button>
            </div>
          </div>

          {/* Actions */}
          <div
            className="form-section actions-section"
          >
            <button className="btn" onClick={handlePrint}>
              🖨 Print Label
            </button>
            <button className="btn btn-secondary" onClick={resetToOrderData}>
              🔄 Reset to Order
            </button>
            <button className="btn btn-warning" onClick={clearAllData}>
              🗑 Clear All
            </button>
          </div>
        </div>

        {/* Right Side: Label Preview */}
        <div
          className="print-label-preview-panel"
        >
          <ShippingLabel
            displayPackDate={displayPackDate(draft.packDate)}
            courierName={courierName(draft)}
            paymentMode={draft.paymentMode}
            paymentAmount={draft.paymentAmount}
            invoiceId={draft.invoiceId}
            awbNumber={draft.awbNumber}
            recipientName={draft.recipientName}
            recipientPhone={draft.recipientPhone}
            recipientAddress={draft.recipientAddress}
            recipientCity={draft.recipientCity}
            recipientPincode={draft.recipientPincode}
            products={draft.products}
          />
        </div>
    </Modal>
  );

  return labelContent;
}
