"use client";

import Modal from "@/src/components/ui/Modal";

interface Props {
  productName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminDeleteConfirm({ productName, loading, onConfirm, onCancel }: Props) {
  return (
    <Modal
      open
      onClose={onCancel}
      labelledBy="delete-modal-title"
      overlayClassName="modal-overlay active"
      contentClassName="modal-content modal-content-md"
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
    </Modal>
  );
}
