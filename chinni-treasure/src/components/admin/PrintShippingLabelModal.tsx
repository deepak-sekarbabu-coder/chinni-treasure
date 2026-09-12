"use client";

import { useState } from "react";
import type { Order, TrackOrderResult } from "@/src/lib/api/schemas";
import ShippingLabel, { type ProductRow } from "./ShippingLabel";

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

export default function PrintShippingLabelModal({ order, isOpen, onClose }: Props) {
  // Helper: Today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: Display date format in DD/MM/YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "--/--/----";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "--/--/----";
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  };

  const initialProducts = (order.items && order.items.length > 0)
    ? order.items.map((item) => ({
      orderId: item.product?.sku || item.productId || "-",
      styleCode: item.productName,
      actualPrice: item.product?.compareAtPrice
        ? Number(item.product.compareAtPrice)
        : Number(item.unitPrice),
      sellPrice: Number(item.unitPrice),
      qty: item.quantity,
    }))
    : [{ orderId: "", styleCode: "", actualPrice: 0, sellPrice: 0, qty: 1 }];

  // Form State
  const [packDate, setPackDate] = useState(getTodayDateString());
  const [invoiceId, setInvoiceId] = useState(order.orderNumber || "");
  const [awbNumber, setAwbNumber] = useState(order.trackingId || "");
  const [paymentAmount, setPaymentAmount] = useState(order.totalAmount || 0);
  const [courierName, setCourierName] = useState("Delhivery Pvt Ltd");
  const [courierSelect, setCourierSelect] = useState("Delhivery Pvt Ltd");
  const [courierCustom, setCourierCustom] = useState("");
  const [paymentMode, setPaymentMode] = useState("Prepaid");
  const [recipientName, setRecipientName] = useState(order.customerName || "");
  const [recipientPhone, setRecipientPhone] = useState(order.customerPhone || "");
  const [recipientAddress, setRecipientAddress] = useState(
    [order.addressLine1, order.addressLine2].filter(Boolean).join(", ")
  );
  const [recipientCity, setRecipientCity] = useState(order.city || "");
  const [recipientPincode, setRecipientPincode] = useState(order.postalCode || "");
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);

  // Reset to current order data
  const resetToOrderData = () => {
    setPackDate(getTodayDateString());
    setInvoiceId(order.orderNumber || "");
    setAwbNumber(order.trackingId || "");
    setPaymentAmount(order.totalAmount || 0);
    setCourierName("Delhivery Pvt Ltd");
    setCourierSelect("Delhivery Pvt Ltd");
    setCourierCustom("");
    setPaymentMode("Prepaid");
    setRecipientName(order.customerName || "");
    setRecipientPhone(order.customerPhone || "");
    setRecipientAddress(
      [order.addressLine1, order.addressLine2].filter(Boolean).join(", ")
    );
    setRecipientCity(order.city || "");
    setRecipientPincode(order.postalCode || "");

    if (order.items && order.items.length > 0) {
      const mapped = order.items.map((item) => ({
        orderId: item.product?.sku || item.productId || "-",
        styleCode: item.productName,
        actualPrice: item.product?.compareAtPrice
          ? Number(item.product.compareAtPrice)
          : Number(item.unitPrice),
        sellPrice: Number(item.unitPrice),
        qty: item.quantity,
      }));
      setProducts(mapped);
    } else {
      setProducts([{ orderId: "", styleCode: "", actualPrice: 0, sellPrice: 0, qty: 1 }]);
    }
  };

  // Clear all fields
  const clearAllData = () => {
    setPackDate(getTodayDateString());
    setInvoiceId("");
    setAwbNumber("");
    setPaymentAmount(0);
    setCourierName("");
    setCourierSelect("");
    setCourierCustom("");
    setPaymentMode("Prepaid");
    setRecipientName("");
    setRecipientPhone("");
    setRecipientAddress("");
    setRecipientCity("");
    setRecipientPincode("");
    setProducts([{ orderId: "", styleCode: "", actualPrice: 0, sellPrice: 0, qty: 1 }]);
  };

  // Collect all shipping label CSS rules from the page stylesheets
  const getLabelCSS = (): string => {
    const labelSelectors = [
      ".label-container", ".label-header", ".label-body", ".main-section",
      ".pack-date", ".title", ".logo-small", ".courier-row", ".courier-cell",
      ".payment-cell", ".mode-label", ".mode-value", ".id-row", ".id-cell",
      ".ship-to-row", ".section-label", ".sold-by-row", ".sold-by-cell",
      ".through-cell", ".logo-through", ".products-header", ".products-body",
      ".product-row", ".col-sno", ".col-products", ".col-detail", ".col-price",
      ".col-qty", ".col-qty-val", ".price-original", ".price-discounted",
      ".handle-care", ".barcode-section", ".awb-text-block", ".awb-heading",
      ".awb-label",
    ];
    const rules: string[] = [];
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (rule instanceof CSSStyleRule) {
              const sel = rule.selectorText || "";
              if (labelSelectors.some((s) => sel.includes(s))) {
                rules.push(rule.cssText);
              }
            }
          }
        } catch { /* cross-origin sheet, skip */ }
      }
    } catch { /* ignore */ }
    return rules.join("\n");
  };

  // Print the label in a new popup window containing only the label content
  const handlePrint = () => {
    const labelEl = document.getElementById("labelContainer");
    if (!labelEl) return;

    const labelHTML = labelEl.innerHTML;
    const labelCSS = getLabelCSS();

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
  .label-container {
    width: 4in;
    height: 6in;
    background: white;
    color: black;
    padding: 0;
    border: 2px solid #000;
    position: relative;
    overflow: hidden;
    font-size: 11px;
    font-family: Arial, sans-serif;
    line-height: 1.2;
  }
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

  if (!isOpen) return null;

  // Product Actions
  const handleProductChange = (index: number, key: keyof ProductRow, val: string | number) => {
    const updated = [...products];
    updated[index] = {
      ...updated[index],
      [key]: val,
    };
    setProducts(updated);
  };

  const addProductRow = () => {
    setProducts([...products, { orderId: "", styleCode: "", actualPrice: 0, sellPrice: 0, qty: 1 }]);
  };

  const removeProductRow = (index: number) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated.length > 0 ? updated : [{ orderId: "", styleCode: "", actualPrice: 0, sellPrice: 0, qty: 1 }]);
  };

  const labelContent = (
    <div
      className="modal-overlay active print-label-overlay-active"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipping-label-editor-title"
    >
      <div
        className="print-label-modal-box"
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
                  value={packDate}
                  onChange={(e) => setPackDate(e.target.value)}
                />
              </div>
              <div className="control-group">
                <label>Invoice ID</label>
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="e.g. CH20260701"
                />
              </div>
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>AWB Number</label>
                <input
                  type="text"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="Enter AWB / Tracking number"
                />
              </div>
              <div className="control-group">
                <label>Payment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
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
                  value={courierSelect}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourierSelect(val);
                    if (val !== "Other") {
                      setCourierName(val);
                      setCourierCustom("");
                    } else {
                      setCourierName(courierCustom);
                    }
                  }}
                >
                  <option value="">Select courier...</option>
                  {COURIER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {courierSelect === "Other" && (
                  <input
                    type="text"
                    value={courierCustom}
                    onChange={(e) => {
                      setCourierCustom(e.target.value);
                      setCourierName(e.target.value);
                    }}
                    placeholder="Enter courier name"
                    style={{ marginTop: "6px" }}
                  />
                )}
              </div>
              <div className="control-group">
                <label>Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
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
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="control-group">
                <label>Receiver Phone</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="control-group">
              <label>Address</label>
              <textarea
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Street, Locality, Landmark"
              />
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>City</label>
                <input
                  type="text"
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="control-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={recipientPincode}
                  onChange={(e) => setRecipientPincode(e.target.value)}
                  placeholder="6 digit pincode"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Product Details */}
          <div className="form-section">
            <div className="section-title">🛍 Product Details</div>
            <div>
              {products.map((p, idx) => (
                <div key={idx} className="product-entry" style={{ position: "relative" }}>
                  {products.length > 1 && (
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
            displayPackDate={formatDisplayDate(packDate)}
            courierName={courierName}
            paymentMode={paymentMode}
            paymentAmount={paymentAmount}
            invoiceId={invoiceId}
            awbNumber={awbNumber}
            recipientName={recipientName}
            recipientPhone={recipientPhone}
            recipientAddress={recipientAddress}
            recipientCity={recipientCity}
            recipientPincode={recipientPincode}
            products={products}
          />
        </div>
      </div>
    </div>
  );

  return labelContent;
}
