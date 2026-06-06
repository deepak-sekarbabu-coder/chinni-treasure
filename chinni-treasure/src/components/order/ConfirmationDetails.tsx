"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateCode: string;
  postalCode: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  transactionId: string | null;
  createdAt: string;
  items: OrderItem[];
}

function generateInvoice(order: OrderData, logoBase64?: string | null): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  let y = margin;

  const gold = "#d4af37";
  const dark = "#1a1a1a";
  const gray = "#555";
  const lightGray = "#999";

  const cx = pageW / 2;

  function addHeart(hx: number, hy: number, hs: number) {
    doc.saveGraphicsState();
    doc.setFillColor("#e74c3c");
    const hr = hs * 0.35;
    doc.circle(hx - hr * 0.6, hy - hr * 0.1, hr, "F");
    doc.circle(hx + hr * 0.6, hy - hr * 0.1, hr, "F");
    doc.triangle(
      hx - hr * 1.15, hy + hr * 0.2,
      hx + hr * 1.15, hy + hr * 0.2,
      hx, hy + hr * 1.5,
      "F",
    );
    doc.restoreGraphicsState();
  }

  if (logoBase64) {
    const logoW = 18;
    const logoH = 18;
    doc.addImage(logoBase64, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 8;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(gold);
  doc.text("Chinni Treasure", cx, y, { align: "center" });
  y += 6;
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(dark);
  doc.text("Little Love", cx, y, { align: "center" });
  const heartSize = 2.5;
  const loveW = doc.getTextWidth("Little Love");
  const gap = 3;
  const heartY = y - 1.2;
  addHeart(cx - loveW / 2 - gap, heartY, heartSize);
  addHeart(cx + loveW / 2 + gap, heartY, heartSize);
  y += 10;

  doc.setDrawColor(gold);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(dark);
  doc.text("Order Invoice", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(gray);
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.text(`Order ID: ${order.orderNumber}`, margin, y);
  doc.text(`Date: ${dateStr}`, margin + 80, y);
  y += 10;

  doc.setDrawColor("#ddd");
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(dark);
  doc.text("Customer Details", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(gray);
  const lines = [
    `Name: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.customerPhone}`,
    `Address: ${order.addressLine1}${order.addressLine2 ? ", " + order.addressLine2 : ""}, ${order.city}, ${order.stateCode} ${order.postalCode}`,
  ];
  for (const line of lines) {
    doc.text(line, margin, y);
    y += 5;
  }
  y += 4;

  if (order.transactionId) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(`Transaction ID: ${order.transactionId}`, margin, y);
    y += 8;
  }

  doc.setDrawColor("#ddd");
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(dark);
  doc.text("Items", margin, y);
  y += 8;

  const nameX = margin;
  const qtyX = 125;
  const priceX = 160;
  const totalX = 190;

  const fmt = (n: number) => `INR ${n.toFixed(2)}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(gold);
  doc.text("Product", nameX, y);
  doc.text("Qty", qtyX, y, { align: "right" });
  doc.text("Unit Price", priceX, y, { align: "right" });
  doc.text("Total", totalX, y, { align: "right" });
  y += 4;
  doc.setDrawColor(gold);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(dark);

  for (const item of order.items) {
    const name = item.productName.length > 35
      ? item.productName.slice(0, 32) + "..."
      : item.productName;
    doc.text(name, nameX, y);
    doc.text(String(item.quantity), qtyX, y, { align: "right" });
    doc.text(fmt(item.unitPrice), priceX, y, { align: "right" });
    doc.text(fmt(item.unitPrice * item.quantity), totalX, y, { align: "right" });
    y += 6;
  }

  y += 2;
  doc.setDrawColor("#ddd");
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.text("Subtotal:", nameX, y);
  doc.setTextColor(dark);
  doc.text(fmt(order.subtotal), totalX, y, { align: "right" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(gray);
  doc.text("Shipping:", nameX, y);
  doc.setTextColor(dark);
  const shippingText = order.shippingCost === 0 ? "Free" : fmt(order.shippingCost);
  doc.text(shippingText, totalX, y, { align: "right" });
  y += 7;

  doc.setDrawColor(gold);
  doc.setLineWidth(0.5);
  doc.line(nameX, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(gold);
  doc.text("Total Charged:", nameX, y);
  doc.text(fmt(order.totalAmount), totalX, y, { align: "right" });
  y += 14;

  doc.setDrawColor("#ddd");
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  doc.text(
    "Your order is pending review. Our team will verify your payment and confirm your order shortly.",
    margin,
    y,
  );
  y += 4;
  doc.text(
    "For any queries, please contact our support team.",
    margin,
    y,
  );
  y += 10;

  doc.setFontSize(7);
  doc.setTextColor(lightGray);
  const footerGap = 2;
  const fhs = 2;
  doc.text("Chinni Treasure", margin, y);
  const fBrandEnd = margin + doc.getTextWidth("Chinni Treasure");
  const fSepW = doc.getTextWidth(" — ");
  const fLoveW = doc.getTextWidth("Little Love");
  const fHeartY = y - 1;
  const fHeart1X = fBrandEnd + fSepW;
  const fLoveX = fHeart1X + fhs + footerGap;
  const fHeart2X = fLoveX + fLoveW + footerGap;
  doc.text(" — ", fBrandEnd, y);
  addHeart(fHeart1X, fHeartY, fhs);
  doc.text("Little Love", fLoveX, y);
  addHeart(fHeart2X, fHeartY, fhs);
  y += 3;
  doc.text("Thank you for your purchase!", margin, y);

  return doc;
}

export default function ConfirmationDetails({ order }: { order: OrderData }) {
  const logoRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/images/branding/logo.png")
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => { logoRef.current = reader.result as string; };
        reader.readAsDataURL(blob);
      });
  }, []);

  const downloadInvoice = useCallback(() => {
    const doc = generateInvoice(order, logoRef.current);
    doc.save(`invoice-${order.orderNumber}.pdf`);
  }, [order]);

  useEffect(() => {
    const timer = setTimeout(() => {
      downloadInvoice();
    }, 500);
    return () => clearTimeout(timer);
  }, [downloadInvoice]);

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
        <p><strong>Total Charged:</strong> ₹{order.totalAmount.toFixed(2)}</p>
      </section>

      <section className="confirmation-items" aria-labelledby="items-heading" style={{ marginBottom: "20px" }}>
        <h3 id="items-heading" style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: "10px", color: "var(--gold)" }}>Items Ordered</h3>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(212,175,55,0.15)", fontSize: "0.85rem" }}>
            <span>{item.productName} <span style={{ color: "var(--text-muted)" }}>×{item.quantity}</span></span>
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span>₹{order.subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Shipping</span>
          <span>{order.shippingCost === 0 ? "Free" : `₹${order.shippingCost.toFixed(2)}`}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", borderTop: "2px solid var(--gold)", marginTop: "4px", fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "1rem" }}>
          <span style={{ color: "var(--gold)" }}>Total Charged</span>
          <span style={{ color: "var(--gold)" }}>₹{order.totalAmount.toFixed(2)}</span>
        </div>
      </section>

      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px" }}>
        Your order is now <strong style={{ color: "var(--warning)" }}>pending review</strong>.
        Our team will verify your payment and confirm your order shortly.
      </p>

      <div className="confirmation-actions" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={downloadInvoice}>
          Download Invoice
        </button>
        <Link href="/" className="btn btn-secondary">Continue Shopping</Link>
        <Link href="/track" className="btn btn-secondary">Track Orders</Link>
      </div>
    </div>
  );
}
