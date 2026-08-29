"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";

interface GiftBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
}

interface SelectedGiftBox {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

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
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedGiftBox[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch gift boxes when modal opens
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setLoading(true);

    let cancelled = false;
    async function fetchGiftBoxes() {
      try {
        const res = await fetch("/api/gift-boxes");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setGiftBoxes(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchGiftBoxes();
    return () => { cancelled = true; };
  }, [open]);

  // Focus the close button on open
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const toggleBox = useCallback((box: GiftBox) => {
    setSelected((prev) => {
      const existing = prev.find((s) => s.productId === box.id);
      if (existing) {
        return prev.filter((s) => s.productId !== box.id);
      }
      return [
        ...prev,
        {
          productId: box.id,
          name: box.name,
          price: box.price,
          image: box.imageUrl || "",
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateBoxQuantity = useCallback((productId: string, delta: number) => {
    setSelected((prev) =>
      prev
        .map((s) => {
          if (s.productId !== productId) return s;
          const newQty = s.quantity + delta;
          if (newQty <= 0) return null;
          return { ...s, quantity: newQty };
        })
        .filter(Boolean) as SelectedGiftBox[]
    );
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const giftBoxTotal = selected.reduce((sum, s) => sum + s.price * s.quantity, 0);

  if (!open) return null;

  return (
    <div
      className="gift-box-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Select a gift box"
    >
      <div className="gift-box-modal">
        <div className="gift-box-modal-header">
          <h2 className="gift-box-modal-title">Add a Gift Box for Packing</h2>
          <button
            ref={closeButtonRef}
            className="gift-box-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="gift-box-modal-product">
          <FallbackImage
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            width={48}
            height={48}
            className="gift-box-modal-product-img"
          />
          <div className="gift-box-modal-product-info">
            <span className="gift-box-modal-product-name">{product.name}</span>
            <span className="gift-box-modal-product-price">
              ₹{product.price.toFixed(2)}
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
                        src={box.imageUrl || "/placeholder.svg"}
                        alt={box.name}
                        width={48}
                        height={48}
                        className="gift-box-modal-option-img"
                      />
                      <div className="gift-box-modal-option-info">
                        <span className="gift-box-modal-option-name">{box.name}</span>
                        <span className="gift-box-modal-option-price">
                          ₹{box.price.toFixed(2)}
                        </span>
                        {box.stockQuantity <= 3 && box.stockQuantity > 0 && (
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
            Add to Cart{giftBoxTotal > 0 ? ` (+₹${giftBoxTotal.toFixed(2)})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
