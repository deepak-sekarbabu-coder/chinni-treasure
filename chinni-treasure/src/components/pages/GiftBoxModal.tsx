"use client";

import { useState, useCallback } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";
import Modal from "@/src/components/ui/Modal";
import { GIFT_PLACEHOLDER } from "@/src/lib/images";
import { stockHealth } from "@/src/lib/product-display";
import { formatMoney } from "@/src/lib/format";
import {
  stepBox,
  toggleBox as toggleGiftBox,
  useGiftBoxes,
  type GiftBox,
  type SelectedGiftBox,
} from "@/src/components/pages/gift-box-picker";

/** A card add carries one product, and the modal's boxes are uncapped by
 *  decision (`GiftBoxModal.test.tsx` pins quantity > 1). The inline picker on
 *  the detail page is the one that caps at the parent quantity. */
const BOX_CAP = Number.POSITIVE_INFINITY;

export interface GiftBoxModalProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: { name: string } | null;
}

interface Props {
  open: boolean;
  product: GiftBoxModalProduct;
  onConfirm: (giftBoxes: SelectedGiftBox[]) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function GiftBoxModal({ open, product, onConfirm, onSkip, onClose }: Props) {
  const { giftBoxes, loading } = useGiftBoxes(open);
  const [selected, setSelected] = useState<SelectedGiftBox[]>([]);

  // Reset the selection each time the modal opens. React's documented "adjust
  // state when a prop changes" render-phase pattern — avoids synchronous
  // setState inside the fetch effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelected([]);
  }

  // Focus, Escape and the body scroll lock are the Modal module's job now.

  const toggleBox = useCallback((box: GiftBox) => {
    setSelected((prev) => toggleGiftBox(prev, box, BOX_CAP));
  }, []);

  const updateBoxQuantity = useCallback((productId: string, delta: number) => {
    setSelected((prev) => stepBox(prev, productId, delta, BOX_CAP));
  }, []);

  const giftBoxTotal = selected.reduce((sum, s) => sum + s.price * s.quantity, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Select a gift box"
      overlayClassName="gift-box-modal-overlay"
      contentClassName="gift-box-modal"
    >
        <div className="gift-box-modal-header">
          <h2 className="gift-box-modal-title">Add a Gift Box for Packing</h2>
          <button
            className="gift-box-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="gift-box-modal-product">
          <FallbackImage
            src={product.image || GIFT_PLACEHOLDER}
            alt={product.name}
            width={48}
            height={48}
            className="gift-box-modal-product-img"
          />
          <div className="gift-box-modal-product-info">
            <span className="gift-box-modal-product-name">{product.name}</span>
            <span className="gift-box-modal-product-price">
              {formatMoney(product.price)}
            </span>
          </div>
        </div>

        <div className="gift-box-modal-body">
          {loading ? (
            <div className="gift-box-modal-loading">
              <span className="gift-box-modal-spinner" aria-hidden="true" />
              Loading gift boxes…
            </div>
          ) : giftBoxes.length === 0 ? (
            <p className="gift-box-modal-empty">No gift boxes available.</p>
          ) : (
            <div className="gift-box-modal-options">
              {giftBoxes.map((box) => {
                const isSelected = selected.some((s) => s.productId === box.id);
                const selectedEntry = selected.find((s) => s.productId === box.id);
                return (
                  <div
                    key={box.id}
                    className={`gift-box-modal-option${isSelected ? " selected" : ""}`}
                  >
                    <button
                      type="button"
                      className="gift-box-modal-option-btn"
                      onClick={() => toggleBox(box)}
                    >
                      <FallbackImage
                        src={box.imageUrl || GIFT_PLACEHOLDER}
                        alt={box.name}
                        width={48}
                        height={48}
                        className="gift-box-modal-option-img"
                      />
                      <div className="gift-box-modal-option-info">
                        <span className="gift-box-modal-option-name">{box.name}</span>
                        <span className="gift-box-modal-option-price">
                          {formatMoney(box.price)}
                        </span>
                        {stockHealth(box.stockQuantity) === "low" && (
                          <span className="gift-box-modal-option-stock">
                            Only {box.stockQuantity} left
                          </span>
                        )}
                      </div>
                      <span className="gift-box-modal-option-check">
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                    {isSelected && selectedEntry && (
                      <div className="gift-box-modal-qty">
                        <button
                          type="button"
                          className="btn-secondary qty-btn"
                          onClick={() => updateBoxQuantity(box.id, -1)}
                          disabled={selectedEntry.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="qty-value">{selectedEntry.quantity}</span>
                        <button
                          type="button"
                          className="btn-secondary qty-btn"
                          onClick={() => updateBoxQuantity(box.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="gift-box-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(selected)}
          >
            Add to Cart{giftBoxTotal > 0 ? ` (+${formatMoney(giftBoxTotal)})` : ""}
          </button>
        </div>
    </Modal>
  );
}
