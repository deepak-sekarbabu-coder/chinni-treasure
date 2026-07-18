"use client";

import StatusBadge from "@/src/components/ui/StatusBadge";
import type { TrackOrderResult } from "@/src/lib/api/schemas";

interface Props {
  order: TrackOrderResult;
  onClick: (order: TrackOrderResult) => void;
}

export default function TrackOrderCard({ order, onClick }: Props) {
  const showTracking = order.status === "shipped" || order.status === "delivered";

  return (
    <div
      className="admin-stat-card"
      style={{ textAlign: "left", marginBottom: "20px", cursor: "pointer" }}
      onClick={() => onClick(order)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
        <div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Order ID
          </span>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginTop: "4px" }}>
            {order.orderNumber}
          </h2>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </p>
          <p style={{ fontSize: "0.85rem", fontWeight: 500, marginTop: "4px" }}>
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600, color: "var(--gold-dark)" }}>
            ₹{Number(order.totalAmount).toFixed(2)}
          </span>
        </div>
      </div>
      {showTracking && order.trackingId && (
        <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            🚚 Courier Tracking ID
          </span>
          <p style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 600, marginTop: "4px", letterSpacing: "1px", color: "#c9a96e" }}>
            {order.trackingId}
          </p>
        </div>
      )}
    </div>
  );
}
