"use client";

import { useState, useEffect } from "react";
import FallbackImage from "@/src/components/ui/FallbackImage";

interface GiftBox {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
}

export interface SelectedGiftBox {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Props {
  parentQuantity: number;
  selected: SelectedGiftBox[];
  onChange: (selected: SelectedGiftBox[]) => void;
}

export default function GiftBoxSelector({ parentQuantity, selected, onChange }: Props) {
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchGiftBoxes() {
      try {
        const res = await fetch("/api/gift-boxes");
        if (res.ok) {
          const data = await res.json();
          setGiftBoxes(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchGiftBoxes();
  }, []);

  const totalSelectedQty = selected.reduce((sum, s) => sum + s.quantity, 0);
  const canAddMore = totalSelectedQty < parentQuantity;

  function toggleBox(box: GiftBox) {
    const existing = selected.find((s) => s.productId === box.id);
    if (existing) {
      onChange(selected.filter((s) => s.productId !== box.id));
    } else if (canAddMore) {
      onChange([
        ...selected,
        { productId: box.id, name: box.name, price: box.price, image: box.imageUrl || "", quantity: 1 },
      ]);
    }
  }

  function updateBoxQuantity(productId: string, delta: number) {
    onChange(
      selected
        .map((s) => {
          if (s.productId !== productId) return s;
          const newQty = s.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > parentQuantity) return s;
          return { ...s, quantity: newQty };
        })
        .filter(Boolean) as SelectedGiftBox[]
    );
  }

  if (loading) return null;
  if (giftBoxes.length === 0) return null;

  return (
    <div className="gift-box-selector">
      <button
        type="button"
        className="gift-box-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="gift-box-toggle-icon">📦</span>
        <span>Add a Gift Box for Packing</span>
        {selected.length > 0 && (
          <span className="gift-box-count">{selected.length}</span>
        )}
        <svg
          className={`gift-box-chevron${isOpen ? " open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="gift-box-list">
          {totalSelectedQty >= parentQuantity && (
            <p className="gift-box-limit-hint">
              Maximum gift boxes reached ({parentQuantity} for {parentQuantity} item{parentQuantity > 1 ? "s" : ""})
            </p>
          )}
          {giftBoxes.map((box) => {
            const isSelected = selected.some((s) => s.productId === box.id);
            const selectedEntry = selected.find((s) => s.productId === box.id);
            return (
              <div key={box.id} className={`gift-box-option ${isSelected ? "selected" : ""}`}>
                <button
                  type="button"
                  className="gift-box-option-main"
                  onClick={() => toggleBox(box)}
                  disabled={isSelected ? false : !canAddMore}
                >
                  <FallbackImage
                    src={box.imageUrl || "/placeholder.svg"}
                    alt={box.name}
                    width={48}
                    height={48}
                    className="gift-box-option-img"
                  />
                  <div className="gift-box-option-info">
                    <span className="gift-box-option-name">{box.name}</span>
                    <span className="gift-box-option-price">₹{box.price.toFixed(2)}</span>
                    {box.stockQuantity <= 3 && box.stockQuantity > 0 && (
                      <span className="gift-box-option-stock">Only {box.stockQuantity} left</span>
                    )}
                  </div>
                  <span className="gift-box-option-check">
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
                {isSelected && selectedEntry && (
                  <div className="gift-box-qty-controls">
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
                      disabled={selectedEntry.quantity >= parentQuantity}
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

      {selected.length > 0 && (
        <div className="gift-box-selected-summary">
          {selected.map((s) => {
            const box = giftBoxes.find((b) => b.id === s.productId);
            if (!box) return null;
            return (
              <span key={s.productId} className="gift-box-selected-tag">
                📦 {box.name} ×{s.quantity}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((x) => x.productId !== s.productId))}
                  aria-label={`Remove ${box.name}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
