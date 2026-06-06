"use client";

import { useFocusTrap } from "@/src/lib/useFocusTrap";

interface Props {
  productName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminDeleteConfirm({ productName, loading, onConfirm, onCancel }: Props) {
  const trapRef = useFocusTrap(true);

  return (
    <div
      className="modal-overlay active"
      ref={trapRef}
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
    >
      <div
        className="modal-content modal-content-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="delete-modal-title">Confirm Delete</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-warning mb-10">
            This action will permanently remove the product from your catalogue.
          </p>
          <div className="delete-box">
            <p className="delete-label">Product</p>
            <p className="delete-name">{productName}</p>
          </div>
          <div className="modal-actions">
            <button
              className={`btn btn-danger ${loading ? "loading" : ""}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && <span className="btn-spinner"></span>}
              {loading ? "Deleting..." : "Yes, Delete Product"}
            </button>
            <button className="btn btn-secondary" onClick={onCancel} autoFocus>
              Keep Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
