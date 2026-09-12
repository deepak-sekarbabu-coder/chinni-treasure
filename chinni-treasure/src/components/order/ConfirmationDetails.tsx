"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import { formatMoney, formatShipping } from "@/src/lib/format";
import { orderLineViews } from "@/src/lib/pricing";
import { generateInvoice, type OrderData } from "@/src/lib/pdf-documents";

export default function ConfirmationDetails({ order }: { order: OrderData }) {
  const logoRef = useRef<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { showToast } = useToast();

  function copyOrderId() {
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      showToast("Order ID copied to clipboard", "success");
    }).catch(() => {
      showToast("Failed to copy Order ID", "error");
    });
  }

  useEffect(() => {
    fetch("/images/branding/logo.png")
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => { logoRef.current = reader.result as string; };
        reader.readAsDataURL(blob);
      });
  }, []);

  const downloadInvoice = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const doc = await generateInvoice(order, logoRef.current);
      doc.save(`invoice-${order.orderNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  }, [order, downloading]);

  return (
    <div className="confirmation-card">
      <div className="confirmation-icon" aria-hidden="true">✓</div>
      <h1 id="confirmation-heading">Order Confirmed!</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        Thank you for your purchase.
      </p>
      <div className="order-number">
        Your Order ID
        <strong>{order.orderNumber}</strong>
      </div>

      <section className="confirmation-details" aria-labelledby="summary-heading">
        <h3 id="summary-heading">Order Summary</h3>
        <p><strong>Name:</strong> {order.customerName}</p>
        <p><strong>Email:</strong> {order.customerEmail}</p>
        <p><strong>Phone:</strong> {order.customerPhone}</p>
        <p>
          <strong>Address:</strong>{" "}
          {`${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}, ${order.city}, ${order.stateCode} ${order.postalCode}`}
        </p>
        {order.transactionId && (
          <p><strong>Transaction ID:</strong> {order.transactionId}</p>
        )}
        <p><strong>Total Charged:</strong> {formatMoney(order.totalAmount)}</p>
      </section>

      <section className="confirmation-items" aria-labelledby="items-heading" style={{ marginBottom: "20px" }}>
        <h3 id="items-heading" style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: "10px", color: "var(--gold)" }}>Items Ordered</h3>
        {orderLineViews(order.items).map((line) =>
          line.parentId ? (
            <div key={line.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0 3px 16px", borderLeft: "2px solid var(--gold)", marginLeft: "8px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span>📦 {line.productName} ×{line.quantity}</span>
              <span>{formatMoney(line.lineTotal)}</span>
            </div>
          ) : (
            <div key={line.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", fontSize: "0.85rem" }}>
              <span>{line.productName} <span style={{ color: "var(--text-muted)" }}>×{line.quantity}</span></span>
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{formatMoney(line.lineTotal)}</span>
            </div>
          )
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Shipping</span>
          <span>{formatShipping(order.shippingCost)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", borderTop: "2px solid var(--gold)", marginTop: "4px", fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1rem" }}>
          <span style={{ color: "var(--gold)" }}>Total Charged</span>
          <span style={{ color: "var(--gold)" }}>{formatMoney(order.totalAmount)}</span>
        </div>
      </section>

      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px" }}>
        Your order is now <strong style={{ color: "var(--warning)" }}>pending review</strong>.
        Our team will verify your payment and confirm your order shortly.
      </p>

      <div className="confirmation-actions" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={copyOrderId}>
          Copy Order ID
        </button>
        <button type="button" className="btn btn-primary" onClick={downloadInvoice} disabled={downloading}>
          {downloading ? "Downloading..." : "Download Invoice"}
        </button>
        <Link href="/" className="btn btn-secondary">Continue Shopping</Link>
        <Link href="/track" className="btn btn-secondary">Track Orders</Link>
      </div>
    </div>
  );
}
