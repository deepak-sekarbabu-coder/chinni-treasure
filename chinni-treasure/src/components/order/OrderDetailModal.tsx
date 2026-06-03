"use client";

import { useEffect } from "react";
import StatusBadge from "@/src/components/ui/StatusBadge";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
} from "@/src/lib/constants";
import { useFocusTrap } from "@/src/lib/useFocusTrap";

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  trackingId?: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  transactionId?: string;
  customerNotes?: string;
  items: OrderItem[];
  addressLine1: string;
  city: string;
  stateCode: string;
  postalCode: string;
}

interface Props {
  order: OrderData;
  onClose: () => void;
  showActions?: boolean;
  onAdvance?: (id: string) => void;
  onReject?: (id: string) => void;
  isTransitioning?: boolean;
}

export default function OrderDetailModal({ order, onClose, showActions, onAdvance, onReject, isTransitioning }: Props) {
  const trapRef = useFocusTrap(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isRejected = order.status === "rejected";
  const completedStatuses = isRejected
    ? ["rejected"]
    : ORDER_STATUS_FLOW.slice(
        0,
        ORDER_STATUS_FLOW.indexOf(order.status) + 1,
      );
  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[currentIdx + 1]
    : null;

  return (
    <div className="modal-overlay active" ref={trapRef} onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="order-detail-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-loading-overlay ${isTransitioning ? "active" : ""}`}>
          <div className="modal-loading-spinner"></div>
          <div className="modal-loading-text">Updating Order Status...</div>
        </div>
        <div className="modal-header">
          <h2 id="order-detail-modal-title">Order {order.orderNumber}</h2>
          <button className="modal-close" onClick={onClose} disabled={isTransitioning}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <h3>
              <span className="section-icon">📋</span> Order Status
            </h3>
            <div className="modal-info-item" style={{ marginBottom: "12px" }}>
              <div className="label">Current Status</div>
              <div className="value">
                <StatusBadge status={order.status} />
              </div>
            </div>
            {order.transactionId && (
              <div className="modal-info-item" style={{ marginBottom: "16px" }}>
                <div className="label">Transaction ID</div>
                <div className="value" style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.5px", color: "var(--gold-dark)" }}>
                  {order.transactionId}
                </div>
              </div>
            )}
            <div className="modal-timeline">
              {isRejected ? (
                <div className="timeline-step rejected">
                  <div className="timeline-dot rejected"></div>
                  <div className="timeline-label">Rejected</div>
                </div>
              ) : (
                ORDER_STATUS_FLOW.map((s) => {
                  const isCompleted = completedStatuses.includes(s);
                  const isCurrent = s === order.status;
                  return (
                    <div
                      key={s}
                      className={`timeline-step ${isCurrent ? "active" : isCompleted ? "completed" : ""}`}
                    >
                      <div className="timeline-dot"></div>
                      <div className="timeline-label">{ORDER_STATUS_LABELS[s]}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {(order.status === "shipped" || order.status === "delivered") && order.trackingId && (
            <div className="modal-section">
              <h3>
                <span className="section-icon">🚚</span> Tracking Information
              </h3>
              <div className="modal-info-item">
                <div className="label">Courier Tracking ID</div>
                <div className="value" style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "1px", color: "#c9a96e" }}>
                  {order.trackingId}
                </div>
              </div>
            </div>
          )}

          <div className="modal-section">
            <h3>
              <span className="section-icon">👤</span> Customer Details
            </h3>
            <div className="modal-info-grid">
              <div className="modal-info-item">
                <div className="label">Name</div>
                <div className="value">{order.customerName}</div>
              </div>
              <div className="modal-info-item">
                <div className="label">Address</div>
                <div className="value">
                  {order.addressLine1}, {order.city}, {order.stateCode} {order.postalCode}
                </div>
              </div>
              <div className="modal-info-item">
                <div className="label">Email</div>
                <div className="value">{order.customerEmail}</div>
              </div>
              <div className="modal-info-item">
                <div className="label">Phone</div>
                <div className="value">{order.customerPhone}</div>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <h3>
              <span className="section-icon">🛍️</span> Items
            </h3>
            <table className="modal-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>₹{Number(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-totals">
              <div className="modal-total-row">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="modal-total-row">
                <span>Shipping</span>
                <span>{Number(order.shippingCost) === 0 ? "Free" : `₹${Number(order.shippingCost).toFixed(2)}`}</span>
              </div>
              <div className="modal-total-row grand">
                <span>Total</span>
                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {showActions && (
            <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {nextStatus && (
                <button
                  className="btn btn-success"
                  onClick={() => onAdvance?.(order.id)}
                  disabled={isTransitioning}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {isTransitioning && <span className="spinner-inline"></span>}
                  Advance to {ORDER_STATUS_LABELS[nextStatus]}
                </button>
              )}
              {order.status === "pending" && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => onReject?.(order.id)}
                  disabled={isTransitioning}
                >
                  Reject Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
