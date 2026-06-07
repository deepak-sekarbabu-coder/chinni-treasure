"use client";

import { useState } from "react";
import { useToast } from "@/src/components/ui/ToastProvider";
import OrderDetailModal from "@/src/components/order/OrderDetailModal";
import TrackOrderCard from "@/src/components/track/TrackOrderCard";
import { useTrackSearch } from "@/src/lib/hooks/useTrackSearch";
import { ApiError } from "@/src/lib/api-client";
import type { TrackOrderResult } from "@/src/lib/api-schemas";

export default function TrackPage() {
  const [method, setMethod] = useState<"order-id" | "phone">("order-id");
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<TrackOrderResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TrackOrderResult | null>(null);
  const { showToast } = useToast();
  const trackSearch = useTrackSearch();

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

    try {
      const params = method === "order-id"
        ? { orderId: orderId.trim() }
        : { phone: phone.replace(/\D/g, "") };
      const data = await trackSearch.mutateAsync(params);
      setResults(data);
      if (data.length === 0) {
        showToast("No orders found", "info");
      } else {
        showToast(`Found ${data.length} order(s)`, "success");
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to search orders";
      showToast(message, "error");
    }
  }

  const loading = trackSearch.isPending;

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
                results.map((order) => (
                  <TrackOrderCard
                    key={order.id}
                    order={order}
                    onClick={(order) => setSelectedOrder(order)}
                  />
                ))
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
