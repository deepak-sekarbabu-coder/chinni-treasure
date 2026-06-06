"use client";

import { useState } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";

interface Props {
  onClose: () => void;
  onSubmit: (trackingId: string) => Promise<void>;
}

export default function AdminTrackingModal({ onClose, onSubmit }: Props) {
  const [trackingId, setTrackingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trapRef = useFocusTrap(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingId.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trackingId.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay active"
      ref={trapRef}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="modal-content modal-content-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="tracking-modal-title">Enter Tracking ID</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="delete-warning mb-16">
              Please provide the courier tracking ID to mark this order as shipped.
            </p>
            <div className="form-group">
              <label htmlFor="tracking-id-input">Courier Tracking ID *</label>
              <input
                id="tracking-id-input"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. TRACK-123456"
                className="input-cream"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                type="submit"
                className="btn btn-success"
                disabled={!trackingId.trim() || submitting}
              >
                {submitting ? "Submitting..." : "Mark as Shipped"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
