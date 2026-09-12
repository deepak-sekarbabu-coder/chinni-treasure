import { formatMoney } from "@/src/lib/format";

interface Props {
  currentStep: number;
  submitting: boolean;
  total: number;
  onNext: () => void;
  onPrev?: () => void;
  isRazorpay: boolean;
  onRazorpayPay: () => void;
  sticky?: boolean;
}

const STEP_LABELS = ["Personal Details", "Delivery Details", "Payment & Review"] as const;

export default function CheckoutActions({ currentStep, submitting, total, onNext, onPrev, isRazorpay, onRazorpayPay, sticky = false }: Props) {
  const buttonClass = sticky ? "btn btn-dark sticky-checkout-btn" : "btn btn-dark step-nav-btn step-nav-next";
  const content = currentStep < 3
    ? <button type="button" className={buttonClass} onClick={onNext}>Next — {STEP_LABELS[currentStep]}</button>
    : isRazorpay
      ? <button type="button" className={buttonClass} onClick={onRazorpayPay} disabled={submitting}>{submitting ? "Processing..." : `Pay ${formatMoney(total)}${sticky ? "" : " with Razorpay"}`}</button>
      : <button type="submit" form={sticky ? "order-form" : undefined} className={buttonClass} disabled={submitting}>{submitting ? "Placing Order..." : `Place Order — ${formatMoney(total)}`}</button>;

  if (sticky) {
    return <div className="sticky-checkout-bar" aria-label="Checkout summary bar"><div className="sticky-checkout-bar-inner"><div className="sticky-checkout-info"><span className="sticky-checkout-label">Total</span><span className="sticky-checkout-price">{formatMoney(total)}</span></div>{content}</div></div>;
  }
  return <div className="step-navigation">{currentStep > 1 && <button type="button" className="btn btn-secondary step-nav-btn" onClick={onPrev}>← Back</button>}{content}</div>;
}
