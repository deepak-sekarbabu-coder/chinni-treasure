"use client";

import { useState } from "react";
import { INDIAN_STATES, INDIAN_CITIES } from "@/src/lib/constants";
import { formatMoney } from "@/src/lib/format";
import ReturnsPolicyModal from "@/src/components/ui/ReturnsPolicyModal";
import { CheckoutError, CheckoutHint, fieldA11y } from "@/src/components/order/CheckoutField";
import type { useCheckoutForm } from "@/src/lib/hooks/useCheckoutForm";

/**
 * The three checkout steps, as a module.
 *
 * They used to live inside the route file, which made them unreachable from a
 * test and forced the page to restate the step partition. Here the partition
 * has one owner (`CheckoutStep` + the hook's field rules) and every step takes
 * the one thing it needs: the checkout state.
 */
export type CheckoutState = ReturnType<typeof useCheckoutForm>;

export function PersonalDetailsStep({ checkout }: { checkout: CheckoutState }) {
  const { form, errors, handleChange, setForm, setErrors } = checkout;
  return (
    <fieldset className="order-fieldset step-fade-in">
      <legend className="order-legend">Personal Details</legend>
      <div className="form-group">
        <label htmlFor="fullName">Full Name <span className="required">*</span></label>
        <input type="text" name="fullName" value={form.fullName} onChange={handleChange} autoComplete="name" {...fieldA11y("fullName", errors.fullName)} />
        <CheckoutError id="fullName" error={errors.fullName} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" {...fieldA11y("email", errors.email)} />
          <CheckoutError id="email" error={errors.email} />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone <span className="required">*</span></label>
          <input type="tel" name="phone" value={form.phone} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10); setForm((prev) => ({ ...prev, phone: cleaned })); if (errors.phone) setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }} maxLength={10} inputMode="numeric" autoComplete="tel" {...fieldA11y("phone", errors.phone)} />
          <CheckoutError id="phone" error={errors.phone} />
          {!errors.phone && <CheckoutHint>We&apos;ll use this to update you on your order</CheckoutHint>}
        </div>
      </div>
    </fieldset>
  );
}

export function DeliveryDetailsStep({ checkout }: { checkout: CheckoutState }) {
  const { form, errors, handleChange, setForm, setErrors, isCustomCity, setIsCustomCity } = checkout;
  return (
    <fieldset className="order-fieldset step-fade-in">
      <legend className="order-legend">Delivery Details</legend>
      <div className="form-group">
        <label htmlFor="address">Address <span className="required">*</span></label>
        <input type="text" name="address" value={form.address} onChange={handleChange} autoComplete="street-address" {...fieldA11y("address", errors.address)} />
        <CheckoutError id="address" error={errors.address} />
      </div>
      <div className="form-group">
        <label htmlFor="addressLine2">Apartment, Suite, Landmark <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Optional)</span></label>
        <input type="text" name="addressLine2" id="addressLine2" value={form.addressLine2} onChange={handleChange} autoComplete="address-line2" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="state">State/UT <span className="required">*</span></label>
          <select name="state" value={form.state} onChange={(e) => { handleChange(e); setForm((prev) => ({ ...prev, city: "" })); setIsCustomCity(false); }} autoComplete="address-level1" {...fieldA11y("state", errors.state)}>
            <option value="">Select State/UT</option>
            {INDIAN_STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
          </select>
          <CheckoutError id="state" error={errors.state} />
        </div>
        <div className="form-group">
          <label htmlFor="city">City <span className="required">*</span></label>
          {!isCustomCity ? (
            <select name="city" value={form.city} onChange={(e) => { if (e.target.value === "__other__") { setIsCustomCity(true); setForm((prev) => ({ ...prev, city: "" })); } else { handleChange(e); } }} autoComplete="address-level2" disabled={!form.state} {...fieldA11y("city", errors.city)}>
              <option value="">{form.state ? "Select City" : "Select State first"}</option>
              {form.state && INDIAN_CITIES[form.state]?.map((city) => (<option key={city} value={city}>{city}</option>))}
              {form.state && <option value="__other__">Other</option>}
            </select>
          ) : (
            <input type="text" name="city" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="Enter your city" autoComplete="address-level2" autoFocus {...fieldA11y("city", errors.city)} />
          )}
          <CheckoutError id="city" error={errors.city} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="zipCode">PIN Code <span className="required">*</span></label>
        <input type="text" name="zipCode" value={form.zipCode} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6); setForm((prev) => ({ ...prev, zipCode: cleaned })); if (errors.zipCode) setErrors((prev) => { const n = { ...prev }; delete n.zipCode; return n; }); }} maxLength={6} inputMode="numeric" autoComplete="postal-code" {...fieldA11y("zipCode", errors.zipCode)} />
        <CheckoutError id="zipCode" error={errors.zipCode} />
        {!errors.zipCode && <CheckoutHint>6-digit delivery PIN code</CheckoutHint>}
      </div>
    </fieldset>
  );
}

export function PaymentStep({
  checkout,
  total,
  onRazorpayPay,
  processing,
}: {
  checkout: CheckoutState;
  total: number;
  onRazorpayPay: () => void;
  processing: boolean;
}) {
  const { form, errors, handleChange, setForm, setErrors } = checkout;
  const [policyOpen, setPolicyOpen] = useState(false);

  function selectPaymentMethod(method: "razorpay" | "manual") {
    setForm((prev) => ({ ...prev, paymentMethod: method }));
    if (errors.transactionId) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.transactionId;
        return n;
      });
    }
  }

  return (
    <>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Terms &amp; Conditions</legend>
        <div className="form-group terms-group">
          <label className="terms-label">
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={form.acceptedTerms}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, acceptedTerms: e.target.checked }));
                if (errors.acceptedTerms) {
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.acceptedTerms;
                    return n;
                  });
                }
              }}
              className={errors.acceptedTerms ? "error" : ""}
              aria-invalid={!!errors.acceptedTerms}
              aria-describedby={errors.acceptedTerms ? "acceptedTerms-error" : undefined}
            />
            <span>
              I have read and agree to the{" "}
              <button
                type="button"
                className="terms-link-btn"
                onClick={(e) => { e.preventDefault(); setPolicyOpen(true); }}
              >
                Return Policy
              </button>
              . I understand that all sales are final, no returns or refunds will be issued, and payment must be completed before order processing.
            </span>
          </label>
          <CheckoutError id="acceptedTerms" error={errors.acceptedTerms} />
        </div>
      </fieldset>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Payment Method</legend>
        <div className="payment-method-selector" role="radiogroup" aria-label="Payment method">
          <label className={`payment-method-option${form.paymentMethod === "razorpay" ? " selected" : ""}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={form.paymentMethod === "razorpay"}
              onChange={() => selectPaymentMethod("razorpay")}
            />
            <span className="payment-method-name">Razorpay</span>
            <span className="payment-method-desc">Card, UPI, Netbanking &amp; Wallets</span>
          </label>
          <label className={`payment-method-option${form.paymentMethod === "manual" ? " selected" : ""}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="manual"
              checked={form.paymentMethod === "manual"}
              onChange={() => selectPaymentMethod("manual")}
            />
            <span className="payment-method-name">Bank Transfer</span>
            <span className="payment-method-desc">Bank Details</span>
          </label>
        </div>
        <p className="form-hint">Pay securely online with Razorpay or transfer directly to our bank account. All payments are encrypted.</p>

        {form.paymentMethod === "razorpay" ? (
          <div className="razorpay-payment-block">
            <p className="razorpay-payment-hint">
              You&apos;ll be redirected to Razorpay&apos;s secure checkout to complete your payment of{" "}
              <strong>{formatMoney(total)}</strong>. After successful payment, your order will be placed automatically.
            </p>
            <button
              type="button"
              className="razorpay-pay-btn"
              onClick={onRazorpayPay}
              disabled={processing || total <= 0}
            >
              {processing ? "Redirecting to Razorpay..." : `Pay ${formatMoney(total)} securely with Razorpay`}
            </button>
            <p className="razorpay-secure-note">🔒 Secured by Razorpay. We never store your card details.</p>
          </div>
        ) : (
          <div className="bank-details-card">
            <div className="bank-detail-row">
              <span className="bank-detail-label">Account Name</span>
              <span className="bank-detail-value">CHINNI TREASURE</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-detail-label">Account Number</span>
              <span className="bank-detail-value">452689137194</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-detail-label">Bank &amp; Branch</span>
              <span className="bank-detail-value">State Bank of India — Madambakkam</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-detail-label">IFSC Code</span>
              <span className="bank-detail-value">SBIN0021634</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-detail-label">MICR Code</span>
              <span className="bank-detail-value">600002379</span>
            </div>
            <p className="bank-details-hint">Make your payment via NEFT/IMPS.</p>
          </div>
        )}
      </fieldset>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Personalized Notes for Gifting</legend>
        <div className="form-group">
          <label htmlFor="notes">Send a Little Love</label>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests or notes for your order" />
        </div>
      </fieldset>
      {form.paymentMethod === "manual" && (
        <fieldset className="order-fieldset step-fade-in">
          <legend className="order-legend">Bank Transfer Reference</legend>
          <div className="form-group">
            <label htmlFor="transactionId">Transaction ID / SIP Reference <span className="required">*</span></label>
            <input type="text" name="transactionId" value={form.transactionId} onChange={handleChange} placeholder="e.g. NEFT-REF-001 or SIP confirmation number" autoComplete="off" {...fieldA11y("transactionId", errors.transactionId)} />
            <CheckoutError id="transactionId" error={errors.transactionId} />
          </div>
        </fieldset>
      )}
      <ReturnsPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}

/**
 * The one place the checkout's steps are partitioned. The route asked for
 * "currentStep === 1 | 2 | 3" itself, which was a second copy of the
 * partition the field rules in the form hook already declare.
 */
export function CheckoutStep({
  step,
  checkout,
  total,
  onRazorpayPay,
  processing,
}: {
  step: number;
  checkout: CheckoutState;
  total: number;
  onRazorpayPay: () => void;
  processing: boolean;
}) {
  if (step === 1) return <PersonalDetailsStep checkout={checkout} />;
  if (step === 2) return <DeliveryDetailsStep checkout={checkout} />;
  if (step === 3) return <PaymentStep checkout={checkout} total={total} onRazorpayPay={onRazorpayPay} processing={processing} />;
  return <PersonalDetailsStep checkout={checkout} />;
}
