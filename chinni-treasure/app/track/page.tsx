"use client";

import { useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import StatusBadge from "@/src/components/ui/StatusBadge";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";

interface OrderResult {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  trackingId?: string;
  createdAt: string;
  itemCount: number;
  items: {
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
  addressLine1: string;
  city: string;
  stateCode: string;
  postalCode: string;
  customerPhone: string;
  customerEmail: string;
  subtotal: number;
  shippingCost: number;
  transactionId?: string;
  customerNotes?: string;
}

export default function TrackPage() {
  const [method, setMethod] = useState<"order-id" | "phone">("order-id");
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<OrderResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);

    if (method === "order-id" && !orderId.trim()) {
      showToast("Please enter an Order ID", "error");
      return;
    }
    if (method === "phone") {
      const clean = phone.replace(/\D/g, "");
      if (clean.length !== 10) {
        showToast("Please enter a valid 10-digit phone number", "error");
        return;
      }
    }

    setLoading(true);
    try {
      const queryParam =
        method === "order-id"
          ? `orderId=${encodeURIComponent(orderId.trim())}`
          : `phone=${encodeURIComponent(phone.replace(/\D/g, ""))}`;
      const res = await fetch(`/api/track?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length === 0) {
          showToast("No orders found", "info");
        } else {
          showToast(`Found ${data.length} order(s)`, "success");
        }
      } else {
        showToast("Failed to search orders", "error");
      }
    } catch {
      showToast("Failed to search orders", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="order-hero" aria-labelledby="track-heading">
        <h1 id="track-heading">Track Your Order</h1>
        <p>Search by your Order ID or Phone Number to view your orders and their status.</p>
      </section>

      <section className="section" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="order-form-section fade-in visible">
          <form onSubmit={handleSearch} aria-label="Order tracking form">
            <div className="track-toggle" role="radiogroup" aria-label="Search method">
              <label className={`track-radio${method === "order-id" ? " active" : ""}`}>
                <input
                  type="radio"
                  name="track-method"
                  value="order-id"
                  checked={method === "order-id"}
                  onChange={() => setMethod("order-id")}
                />
                <span className="track-radio-indicator"></span>
                <span className="track-radio-label">Order ID</span>
              </label>
              <label className={`track-radio${method === "phone" ? " active" : ""}`}>
                <input
                  type="radio"
                  name="track-method"
                  value="phone"
                  checked={method === "phone"}
                  onChange={() => setMethod("phone")}
                />
                <span className="track-radio-indicator"></span>
                <span className="track-radio-label">Phone Number</span>
              </label>
            </div>

            {method === "order-id" ? (
              <div className="form-group">
                <label htmlFor="track-order-id">Order ID</label>
                <input
                  type="text"
                  id="track-order-id"
                  placeholder="e.g. ORD-..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="track-phone">Phone Number</label>
                <input
                  type="tel"
                  id="track-phone"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Searching..." : "Search Orders"}
            </button>
          </form>
        </div>

        {searched && (
          <div style={{ marginTop: "40px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: "24px", textAlign: "center" }}>
              {results.length > 0 ? "Recent Orders" : "No Results"}
            </h2>
            <div id="track-orders-list" role="list">
              {results.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                  {method === "order-id"
                    ? "No orders found matching this Order ID."
                    : "No orders found for this phone number."}
                </p>
              ) : (
                results.map((order) => {
                  const showTracking =
                    order.status === "shipped" || order.status === "delivered";

                  return (
                    <div
                      key={order.id}
                      className="admin-stat-card"
                      style={{
                        textAlign: "left",
                        marginBottom: "20px",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            Order ID
                          </span>
                          <h4
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "1.1rem",
                              marginTop: "4px",
                            }}
                          >
                            {order.orderNumber}
                          </h4>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "end",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "4px" }}>
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-serif)",
                              fontSize: "1.2rem",
                              fontWeight: 600,
                              color: "var(--gold-dark)",
                            }}
                          >
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {showTracking && order.trackingId && (
                        <div
                          style={{
                            marginTop: "14px",
                            paddingTop: "12px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            🚚 Courier Tracking ID
                          </span>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              marginTop: "4px",
                              letterSpacing: "1px",
                              color: "#c9a96e",
                            }}
                          >
                            {order.trackingId}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
