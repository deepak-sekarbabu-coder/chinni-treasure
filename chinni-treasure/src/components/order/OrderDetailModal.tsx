"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/src/components/ui/StatusBadge";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VOCABULARY,
  nextOrderStatus,
} from "@/src/lib/constants";
import type { FlowStatus } from "@/src/lib/constants";

import { useFocusTrap } from "@/src/lib/useFocusTrap";
import type { Order, TrackOrderResult } from "@/src/lib/api/schemas";
import { formatMoney, formatShipping } from "@/src/lib/format";
import { orderLineViews } from "@/src/lib/pricing";
import { orderTimeline } from "@/src/lib/order-view";
import PrintShippingLabelModal from "@/src/components/admin/PrintShippingLabelModal";

interface Props {
  order: Partial<Order> & TrackOrderResult;
  onClose: () => void;
  showActions?: boolean;
  onAdvance?: (id: string) => void;
  onReject?: (id: string) => void;
  isTransitioning?: boolean;
  onUpdateTracking?: (orderId: string, trackingId: string) => Promise<void>;
}

/** A timeline timestamp, rendered beside the step label when the surface has one. */
function TimelineDate({ at }: { at: string | null }) {
  if (!at) return null;
  return (
    <div className="timeline-date">
      {new Date(at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  );
}

export default function OrderDetailModal({ order, onClose, showActions, onAdvance, onReject, isTransitioning, onUpdateTracking }: Props) {
  const trapRef = useFocusTrap(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [editTrackingValue, setEditTrackingValue] = useState(order.trackingId || "");
  const [savingTracking, setSavingTracking] = useState(false);

  const handleTrackingSave = async () => {
    if (!editTrackingValue.trim() || !onUpdateTracking) return;
    setSavingTracking(true);
    try {
      await onUpdateTracking(order.id, editTrackingValue.trim());
      setIsEditingTracking(false);
    } finally {
      setSavingTracking(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // The nested shipping-label modal is intentionally dismissed only by
      // its own Close button, so the parent must not handle Escape while it
      // is open.
      if (e.key === "Escape" && !showPrintModal) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, showPrintModal]);

  const vocabulary = ORDER_STATUS_VOCABULARY;
  const flow = vocabulary.flow as readonly FlowStatus[];

  // The timeline is projected by the Order view module: the persisted status
  // history when this surface carries it (tracking, order detail), the forward
  // flow otherwise (the admin list, which doesn't load history).
  const timeline = orderTimeline(order.status, order.statusHistory);
  const nextStatus = nextOrderStatus(order.status);

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
                <div className="value" style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.5px", color: "var(--gold-deep)" }}>
                  {order.transactionId}
                </div>
              </div>
            )}
            <div className="modal-timeline">
              {timeline.map((entry, index) => {
                const isRejectedStep = entry.status === "rejected";
                const isCompleted = !entry.isCurrent && index < timeline.length - 1;
                const className = isRejectedStep
                  ? "timeline-step rejected"
                  : `timeline-step ${entry.isCurrent ? "active" : isCompleted ? "completed" : ""}`;
                return (
                  <div key={`${entry.status}-${entry.at ?? index}`} className={className}>
                    <div className={`timeline-dot ${isRejectedStep ? "rejected" : ""}`}></div>
                    <div className="timeline-label">{entry.label}</div>
                    <TimelineDate at={entry.at} />
                  </div>
                );
              })}
            </div>
          </div>

          {(flow.includes(order.status as (typeof vocabulary.flow)[number]) && (order.status === "shipped" || order.status === "delivered")) && (
            <div className="modal-section">
              <h3>
                <span className="section-icon">🚚</span> Tracking Information
                {showActions && !isEditingTracking && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditTrackingValue(order.trackingId || "");
                      setIsEditingTracking(true);
                    }}
                    disabled={isTransitioning || savingTracking}
                    style={{ marginLeft: "auto", fontSize: "12px", padding: "4px 12px" }}
                  >
                    {order.trackingId ? "Edit" : "Add Tracking"}
                  </button>
                )}
              </h3>
              {isEditingTracking ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                  <input
                    type="text"
                    value={editTrackingValue}
                    onChange={(e) => setEditTrackingValue(e.target.value)}
                    placeholder="Enter courier tracking ID"
                    className="input-cream"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editTrackingValue.trim()) {
                        handleTrackingSave();
                      } else if (e.key === "Escape") {
                        setIsEditingTracking(false);
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-success"
                    onClick={handleTrackingSave}
                    disabled={!editTrackingValue.trim() || savingTracking}
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                  >
                    {savingTracking ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditingTracking(false)}
                    disabled={savingTracking}
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="modal-info-item">
                  <div className="label">Courier Tracking ID</div>
                  <div className="value" style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "1px", color: "#c9a96e" }}>
                    {order.trackingId || "Not set"}
                  </div>
                </div>
              )}
            </div>
          )}

          {(order.customerName || order.customerEmail) && (
            <div className="modal-section">
              <h3>
                <span className="section-icon">👤</span> Customer Details
              </h3>
              <div className="modal-info-grid">
                {order.customerName && (
                  <div className="modal-info-item">
                    <div className="label">Name</div>
                    <div className="value">{order.customerName}</div>
                  </div>
                )}
                {order.addressLine1 && (
                  <div className="modal-info-item">
                    <div className="label">Address</div>
                    <div className="value">
                      {order.addressLine1}, {order.city}, {order.stateCode} {order.postalCode}
                    </div>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="modal-info-item">
                    <div className="label">Email</div>
                    <div className="value">{order.customerEmail}</div>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="modal-info-item">
                    <div className="label">Phone</div>
                    <div className="value">{order.customerPhone}</div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                {orderLineViews(order.items ?? []).map((line) => (
                  <tr key={line.id} className={line.parentId ? "gift-box-order-row" : undefined}>
                    <td style={line.parentId ? { paddingLeft: "24px", fontSize: "0.82rem", color: "var(--text-muted)" } : undefined}>
                      {line.parentId ? `📦 ${line.productName}` : line.productName}
                    </td>
                    <td style={line.parentId ? { fontSize: "0.82rem" } : undefined}>{line.quantity}</td>
                    <td style={line.parentId ? { fontSize: "0.82rem" } : undefined}>{formatMoney(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-totals">
              <div className="modal-total-row">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal ?? 0)}</span>
              </div>
              <div className="modal-total-row">
                <span>Shipping</span>
                <span>{formatShipping(order.shippingCost ?? 0)}</span>
              </div>
              <div className="modal-total-row grand">
                <span>Total</span>
                <span>{formatMoney(order.totalAmount ?? 0)}</span>
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintModal(true)}
                disabled={isTransitioning}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                🖨️ Print Shipping Label
              </button>
            </div>
          )}
        </div>
      </div>
      {showPrintModal && (
        <PrintShippingLabelModal
          order={order}
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
