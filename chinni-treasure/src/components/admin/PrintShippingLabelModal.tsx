"use client";

import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { Order, TrackOrderResult } from "@/src/lib/api/schemas";

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

interface ProductRow {
  orderId: string;      // Product Code / SKU
  styleCode: string;    // Product Description / Style
  actualPrice: number;  // Compare at price / Original price
  sellPrice: number;    // Unit price / Sale price
  qty: number;          // Quantity
}

export default function PrintShippingLabelModal({ order, isOpen, onClose }: Props) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

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

  // Dynamically insert and clean up page-size print styles while the modal is open
  useEffect(() => {
    if (isOpen) {
      const styleEl = document.createElement("style");
      styleEl.id = "shipping-label-print-style";
      styleEl.innerHTML = `
        @page {
          size: 4in 6in;
          margin: 0;
        }
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide the parent dashboard and all other modals */
          body > *:not(.print-label-overlay-active) {
            display: none !important;
          }
          /* Ensure the overlay takes up the whole printing page */
          .print-label-overlay-active {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: block !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-label-modal-box {
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide editor controls panel entirely */
          .print-label-editor-panel {
            display: none !important;
          }
          /* Style the preview container to fill exactly 4in x 6in */
          .print-label-preview-panel {
            width: 4in !important;
            height: 6in !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .label-container {
            width: 4in !important;
            height: 6in !important;
            box-shadow: none !important;
            margin: 0 !important;
            border: 1px solid #000 !important;
            page-break-inside: avoid !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
      return () => {
        const el = document.getElementById("shipping-label-print-style");
        if (el) {
          document.head.removeChild(el);
        }
      };
    }
  }, [isOpen]);

  // Generate Barcode on AWB change
  useEffect(() => {
    if (awbNumber && awbNumber.trim().length > 0 && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, awbNumber.trim(), {
          format: "CODE128",
          width: 1.5,
          height: 45,
          displayValue: false,
          margin: 1,
        });
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
    }
  }, [awbNumber, products]); // re-run if products list or AWB changes and DOM updates

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

  return (
    <div className="modal-overlay active print-label-overlay-active" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        className="print-label-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Editor Form */}
        <div
          className="print-label-editor-panel"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-dark)" }}>
              Shipping Label Editor
            </h2>
            <button
              onClick={onClose}
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
            <button className="btn" onClick={() => window.print()}>
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
          <div
            className="label-container"
            id="labelContainer"
            style={{
              width: "4in",
              height: "6in",
              background: "white",
              padding: "0",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
              border: "2px solid #000",
              position: "relative",
              overflow: "hidden",
              fontSize: "11px",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {/* Header */}
            <div className="label-header">
              <div className="pack-date">
                Packaging Date: <span id="displayPackDate">{formatDisplayDate(packDate)}</span>
              </div>
              <div className="title">
                <img
                  id="labelLogoSmall"
                  className="logo-small"
                  src="/Final1.jpg"
                  alt="Chinni Treasure"
                />
                CHINNI TREASURE
              </div>
            </div>

            <div className="label-body">
              <div className="main-section">
                {/* Courier Row */}
                <div className="courier-row">
                  <div className="courier-cell">
                    Courier: <span id="displayCourier">{courierName || "None"}</span>
                  </div>
                  <div className="payment-cell">
                    <div className="mode-label">Payment Mode</div>
                    <div className="mode-value">
                      <span id="displayPayMode">{paymentMode}</span> - ₹
                      <span id="displayPayAmount">{paymentAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Invoice ID & AWB Row */}
                <div className="id-row">
                  <div className="id-cell">
                    <strong>Invoice ID:</strong> <span id="displayInvoiceId">{invoiceId || "-"}</span>
                  </div>
                  <div className="id-cell">
                    <strong>AWB No:</strong>{" "}
                    <span
                      id="displayAWBNo"
                      style={{ fontSize: "13px", fontWeight: 700, color: "#000" }}
                    >
                      {awbNumber || "-"}
                    </span>
                  </div>
                </div>

                {/* Ship To Row */}
                <div className="ship-to-row">
                  <div className="section-label">Ship To:</div>
                  <div className="content">
                    <div className="name" id="displayRecipientName">
                      {recipientName || "Receiver Name"}
                    </div>
                    {recipientPhone && (
                      <div id="displayRecipientPhone" className="name">
                        Ph No: {recipientPhone}
                      </div>
                    )}
                    <div className="name" id="displayRecipientAddress">
                      {recipientAddress || "Address"}
                    </div>
                    <div className="pincode">
                      <span id="displayRecipientCity">{recipientCity || "City"}</span> -{" "}
                      <span id="displayRecipientPincode">{recipientPincode || "Pincode"}</span>
                    </div>
                  </div>
                </div>

                {/* Sold By / Through Row */}
                <div className="sold-by-row">
                  <div className="sold-by-cell">
                    <div className="section-label">Sold By:</div>
                    <div className="content">
                      <div className="company">CHINNI TREASURE</div>
                      <div>Ph No. +91 9499011029</div>
                      <div>Alt No. +91 8754730318</div>
                      <div>No. 10/24, T2, Unicorn Properties,</div>
                      <div>Kaveri Street Extn, Gowriwakkam,</div>
                      <div>Chennai - 600073</div>
                      <div style={{ marginTop: "4px", fontSize: "9px", fontWeight: "bold", color: "#000" }}>
                        If delivery to the shipping address is unsuccessful, please return the package
                        to this address.
                      </div>
                    </div>
                  </div>
                  <div className="through-cell">
                    <div className="content" id="displayThrough">
                      <img
                        id="labelLogoThrough"
                        className="logo-through"
                        src="/Final1.jpg"
                        alt="Chinni Treasure"
                      />
                    </div>
                  </div>
                </div>

                {/* Products Header */}
                <div className="products-header">
                  <div
                    className="col-sno"
                    style={{
                      width: "30px",
                      padding: "3px 6px",
                      fontWeight: "bold",
                      borderRight: "1px solid #000",
                      textAlign: "center",
                      fontSize: "10px",
                    }}
                  >
                    #
                  </div>
                  <div className="col-products">Products</div>
                  <div className="col-price">Price</div>
                  <div className="col-qty">Qty</div>
                </div>

                {/* Products Body */}
                <div className="products-body" id="productsBody">
                  {products.map((p, idx) => (
                    <div key={idx} className="product-row">
                      <div className="col-sno">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="col-detail">
                        {p.orderId} | {p.styleCode}
                      </div>
                      <div className="col-price">
                        {p.actualPrice > 0 && p.sellPrice > 0 && p.sellPrice < p.actualPrice ? (
                          <>
                            <span className="price-original">₹{p.actualPrice.toFixed(2)}</span>
                            <span className="price-discounted">₹{p.sellPrice.toFixed(2)}</span>
                          </>
                        ) : p.sellPrice > 0 ? (
                          <span className="price-discounted">₹{p.sellPrice.toFixed(2)}</span>
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </div>
                      <div className="col-qty-val">{String(p.qty).padStart(2, "0")}</div>
                    </div>
                  ))}
                </div>

                {/* Handle with Care Footer */}
                <div className="handle-care">⚠️ HANDLE WITH CARE ⚠️</div>
              </div>

              {/* Barcode Section (Bottom) */}
              <div className="barcode-section">
                {awbNumber && awbNumber.trim().length > 0 ? (
                  <div
                    id="barcodeWrapper"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "0px",
                    }}
                  >
                    <svg ref={barcodeRef} style={{ display: "block" }}></svg>
                    <div className="awb-text-block">
                      <span className="awb-heading">AWB Number</span>
                      <span className="awb-label" id="displayAWBBarcode">
                        {awbNumber}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
