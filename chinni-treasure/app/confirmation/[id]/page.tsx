"use client";

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  status: string;
  trackingId?: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  transactionId?: string;
  customerNotes?: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export default function ConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h1>Order Not Found</h1>
          <p>We couldn&apos;t find your order. Please check your order ID.</p>
          <div className="confirmation-actions" style={{ marginTop: "24px" }}>
            <Link href="/" className="btn btn-primary">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon" aria-hidden="true">
          ✓
        </div>
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
          <p>
            <strong>Name:</strong> {order.customerName}
          </p>
          <p>
            <strong>Email:</strong> {order.customerEmail}
          </p>
          <p>
            <strong>Phone:</strong> {order.customerPhone}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {`${order.addressLine1}, ${order.city}, ${order.stateCode} ${order.postalCode}`}
          </p>
          {order.transactionId && (
            <p>
              <strong>Transaction ID:</strong> {order.transactionId}
            </p>
          )}
          <p>
            <strong>Total Charged:</strong> ₹{Number(order.totalAmount).toFixed(2)}
          </p>
        </section>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px" }}>
          Your order is now <strong style={{ color: "var(--warning)" }}>pending review</strong>.
          Our team will verify your payment and confirm your order shortly.
        </p>

        <div className="confirmation-actions">
          <Link href="/" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link href="/track" className="btn btn-secondary">
            Track Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
