"use client";

import { useFocusTrap } from "@/src/lib/useFocusTrap";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReturnsPolicyModal({ open, onClose }: Props) {
  const trapRef = useFocusTrap(open);

  if (!open) return null;

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
        aria-labelledby="returns-policy-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="returns-policy-title">Returns Policy</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="returns-policy-card">
            <div className="returns-policy-rule">
              <span className="returns-policy-icon returns-policy-icon-x">✕</span>
              <div>
                <strong>No Returns</strong>
                <p>All sales are final. We do not accept returns or exchanges.</p>
              </div>
            </div>
            <div className="returns-policy-rule">
              <span className="returns-policy-icon returns-policy-icon-x">✕</span>
              <div>
                <strong>No COD</strong>
                <p>Cash on Delivery is not available. Full payment is required to process your order.</p>
              </div>
            </div>
            <div className="returns-policy-rule">
              <span className="returns-policy-icon returns-policy-icon-x">✕</span>
              <div>
                <strong>No Cancellations &amp; No Refunds</strong>
                <p>Once the order is placed, it cannot be cancelled and no refund will be issued.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
