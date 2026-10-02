"use client";

import Modal from "@/src/components/ui/Modal";

interface Props {
  /** The row being deleted, as it reads in the dialog. */
  name: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** What is being deleted — drives the label and the button copy. */
  noun?: string;
  /** Overrides the default warning line (e.g. a blocked delete's reason). */
  warning?: string;
  /** A delete the server will refuse: the confirm button is disabled, not hidden. */
  blocked?: boolean;
}

/**
 * The admin delete confirmation. The categories panel used to hand-print its
 * own copy of this modal — same frame, same buttons, different noun and an
 * extra "blocked" state — so a fix to the dialog reached only one of the two.
 */
export default function AdminDeleteConfirm({
  name,
  loading,
  onConfirm,
  onCancel,
  noun = "Product",
  warning = `This action will permanently remove the ${noun.toLowerCase()} from your catalogue.`,
  blocked = false,
}: Props) {
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
        <button className="modal-close" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>
      <div className="modal-body">
        <p className="delete-warning mb-10">{warning}</p>
        <div className="delete-box">
          <p className="delete-label">{noun}</p>
          <p className="delete-name">{name}</p>
        </div>
        <div className="modal-actions">
          <button
            className={`btn btn-danger ${loading ? "loading" : ""}`}
            onClick={onConfirm}
            disabled={loading || blocked}
          >
            {loading && <span className="btn-spinner"></span>}
            {blocked ? `Cannot Delete ${noun}` : loading ? `Deleting...` : `Yes, Delete ${noun}`}
          </button>
          <button className="btn btn-secondary" onClick={onCancel} autoFocus>
            Keep {noun}
          </button>
        </div>
      </div>
    </Modal>
  );
}