"use client";

import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD } from "@/src/lib/pricing";
import { formatRupees } from "@/src/lib/format";
import { useFocusTrap } from "@/src/lib/useFocusTrap";
import type { ShippingNudgeState } from "@/src/lib/hooks/useShippingNudge";

interface Props {
  show: ShippingNudgeState["show"];
  newTotal: ShippingNudgeState["newTotal"];
  shippingLeft: ShippingNudgeState["shippingLeft"];
  dismiss: ShippingNudgeState["dismiss"];
}


export default function ShippingNudgePopup({
  show,
  newTotal,
  shippingLeft,
  dismiss,
}: Props) {
  const trapRef = useFocusTrap(show);

  if (!show) return null;

  const progress = Math.min(100, Math.max(0, (newTotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div
      className="shipping-nudge-overlay"
      ref={trapRef}
      onClick={dismiss}
      onKeyDown={(e) => {
        if (e.key === "Escape") dismiss();
      }}
    >
      <div
        className="shipping-nudge-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipping-nudge-title"
        aria-describedby="shipping-nudge-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shipping-nudge-handle" aria-hidden="true" />
        <div className="shipping-nudge-header">
          <p className="shipping-nudge-kicker">Free shipping unlocked soon</p>
          <h2 id="shipping-nudge-title">
            Add ₹{formatRupees(shippingLeft)} more for FREE shipping!
          </h2>
          <p id="shipping-nudge-description" className="shipping-nudge-copy">
            You have ₹{formatRupees(newTotal)} in your cart. Reach ₹{formatRupees(FREE_SHIPPING_THRESHOLD)} to skip shipping charges.
          </p>
        </div>

        <div className="shipping-nudge-progress" aria-label="Free shipping progress">
          <div className="shipping-nudge-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_THRESHOLD} aria-valuenow={Math.min(FREE_SHIPPING_THRESHOLD, Math.round(newTotal))}>
            <div className="shipping-nudge-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="shipping-nudge-progress-meta">
            <span>Cart total</span>
            <span>₹{formatRupees(newTotal)}</span>
          </div>
        </div>

        <div className="shipping-nudge-actions">
          <Link href="/catalogue" className="btn btn-primary btn-full btn-tall shipping-nudge-continue" onClick={dismiss}>
            Continue Shopping
          </Link>
          <button type="button" className="shipping-nudge-dismiss" onClick={dismiss}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
