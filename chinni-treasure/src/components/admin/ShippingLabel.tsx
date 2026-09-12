"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { formatMoney } from "@/src/lib/format";

export interface ProductRow {
  orderId: string;
  styleCode: string;
  actualPrice: number;
  sellPrice: number;
  qty: number;
}

interface Props {
  displayPackDate: string;
  courierName: string;
  paymentMode: string;
  paymentAmount: number;
  invoiceId: string;
  awbNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientPincode: string;
  products: ProductRow[];
}

export default function ShippingLabel({
  displayPackDate,
  courierName,
  paymentMode,
  paymentAmount,
  invoiceId,
  awbNumber,
  recipientName,
  recipientPhone,
  recipientAddress,
  recipientCity,
  recipientPincode,
  products,
}: Props) {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Generate Barcode on AWB change. jsbarcode (~100KB+) is imported lazily so
  // it stays out of the initial bundle and only loads when a shipping label
  // actually renders a barcode.
  useEffect(() => {
    if (!awbNumber || awbNumber.trim().length === 0 || !barcodeRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const JsBarcode = (await import("jsbarcode")).default;
        if (cancelled || !barcodeRef.current) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [awbNumber, products]); // re-run if products list or AWB changes and DOM updates

  return (
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
          Packaging Date: <span id="displayPackDate">{displayPackDate}</span>
        </div>
        <div className="title">
          <Image
            id="labelLogoSmall"
            className="logo-small"
            src="/Final1.jpg"
            alt="Chinni Treasure"
            width={40}
            height={40}
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
                <Image
                  id="labelLogoThrough"
                  className="logo-through"
                  src="/Final1.jpg"
                  alt="Chinni Treasure"
                  width={60}
                  height={60}
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
                      <span className="price-original">{formatMoney(p.actualPrice)}</span>
                      <span className="price-discounted">{formatMoney(p.sellPrice)}</span>
                    </>
                  ) : p.sellPrice > 0 ? (
                    <span className="price-discounted">{formatMoney(p.sellPrice)}</span>
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
  );
}