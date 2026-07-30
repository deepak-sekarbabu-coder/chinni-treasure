"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import SectionHeader from "@/src/components/ui/SectionHeader";
import CheckoutProgress from "@/src/components/order/CheckoutProgress";
import OrderSummaryCard from "@/src/components/order/OrderSummaryCard";
import { INDIAN_STATES, INDIAN_CITIES, calcShippingCost, FREE_SHIPPING_THRESHOLD } from "@/src/lib/constants";
import { usePlaceOrder } from "@/src/lib/hooks/useAdminMutations";
import { ApiError } from "@/src/lib/api/client";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/src/lib/api";
import { loadRazorpayScript } from "@/src/lib/razorpay";
import type { RazorpayResponse } from "@/src/types/razorpay";

import ReturnsPolicyModal from "@/src/components/ui/ReturnsPolicyModal";

interface OrderForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  transactionId: string;
  notes: string;
  acceptedTerms: boolean;
  paymentMethod: "razorpay" | "manual";
}

const STEP_LABELS = ["Personal Details", "Delivery Details", "Payment & Review"] as const;

type ValidationRule = {
  field: string;
  test: (form: OrderForm) => string | undefined;
  step: number;
};

const VALIDATION_RULES: ValidationRule[] = [
  { field: "fullName", step: 1, test: (f) => !f.fullName.trim() ? "Full name is required" : undefined },
  { field: "email", step: 1, test: (f) => !f.email.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? "Invalid email address" : undefined },
  { field: "phone", step: 1, test: (f) => !f.phone.trim() ? "Phone is required" : f.phone.replace(/\D/g, "").length !== 10 ? "Enter a valid 10-digit phone number" : undefined },
  { field: "address", step: 2, test: (f) => !f.address.trim() ? "Address is required" : undefined },
  { field: "city", step: 2, test: (f) => !f.city.trim() ? "City is required" : undefined },
  { field: "state", step: 2, test: (f) => !f.state ? "State/UT is required" : undefined },
  { field: "zipCode", step: 2, test: (f) => !f.zipCode.trim() ? "PIN code is required" : f.zipCode.replace(/\D/g, "").length !== 6 ? "Enter a valid 6-digit PIN code" : undefined },
  { field: "acceptedTerms", step: 3, test: (f) => !f.acceptedTerms ? "You must accept the terms and conditions" : undefined },
];

function runValidation(form: OrderForm, step?: number): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const rule of VALIDATION_RULES) {
    if (step !== undefined && rule.step !== step) continue;
    const msg = rule.test(form);
    if (msg) errs[rule.field] = msg;
  }
  return errs;
}

function PersonalDetailsStep({ form, errors, handleChange, setForm, setErrors }: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <fieldset className="order-fieldset step-fade-in">
      <legend className="order-legend">Personal Details</legend>
      <div className="form-group">
        <label htmlFor="fullName">Full Name <span className="required">*</span></label>
        <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className={errors.fullName ? "error" : ""} autoComplete="name" aria-describedby={errors.fullName ? "fullName-error" : undefined} aria-invalid={!!errors.fullName} />
        {errors.fullName && <span id="fullName-error" className="form-error visible">{errors.fullName}</span>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className={errors.email ? "error" : ""} autoComplete="email" aria-describedby={errors.email ? "email-error" : undefined} aria-invalid={!!errors.email} />
          {errors.email && <span id="email-error" className="form-error visible">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone <span className="required">*</span></label>
          <input type="tel" id="phone" name="phone" value={form.phone} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10); setForm((prev) => ({ ...prev, phone: cleaned })); if (errors.phone) setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }} className={errors.phone ? "error" : ""} maxLength={10} inputMode="numeric" autoComplete="tel" aria-describedby={errors.phone ? "phone-error" : undefined} aria-invalid={!!errors.phone} />
          {errors.phone && <span id="phone-error" className="form-error visible">{errors.phone}</span>}
          {!errors.phone && <span className="form-hint">We&apos;ll use this to update you on your order</span>}
        </div>
      </div>
    </fieldset>
  );
}

function DeliveryDetailsStep({ form, errors, handleChange, setForm, setErrors, isCustomCity, setIsCustomCity }: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isCustomCity: boolean;
  setIsCustomCity: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <fieldset className="order-fieldset step-fade-in">
      <legend className="order-legend">Delivery Details</legend>
      <div className="form-group">
        <label htmlFor="address">Address <span className="required">*</span></label>
        <input type="text" id="address" name="address" value={form.address} onChange={handleChange} className={errors.address ? "error" : ""} autoComplete="street-address" aria-describedby={errors.address ? "address-error" : undefined} aria-invalid={!!errors.address} />
        {errors.address && <span id="address-error" className="form-error visible">{errors.address}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="addressLine2">Apartment, Suite, Landmark <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Optional)</span></label>
        <input type="text" id="addressLine2" name="addressLine2" value={form.addressLine2} onChange={handleChange} autoComplete="address-line2" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="state">State/UT <span className="required">*</span></label>
          <select id="state" name="state" value={form.state} onChange={(e) => { handleChange(e); setForm((prev) => ({ ...prev, city: "" })); setIsCustomCity(false); }} className={errors.state ? "error" : ""} autoComplete="address-level1" aria-describedby={errors.state ? "state-error" : undefined} aria-invalid={!!errors.state}>
            <option value="">Select State/UT</option>
            {INDIAN_STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
          </select>
          {errors.state && <span id="state-error" className="form-error visible">{errors.state}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="city">City <span className="required">*</span></label>
          {!isCustomCity ? (
            <select id="city" name="city" value={form.city} onChange={(e) => { if (e.target.value === "__other__") { setIsCustomCity(true); setForm((prev) => ({ ...prev, city: "" })); } else { handleChange(e); } }} className={errors.city ? "error" : ""} autoComplete="address-level2" aria-describedby={errors.city ? "city-error" : undefined} aria-invalid={!!errors.city} disabled={!form.state}>
              <option value="">{form.state ? "Select City" : "Select State first"}</option>
              {form.state && INDIAN_CITIES[form.state]?.map((city) => (<option key={city} value={city}>{city}</option>))}
              {form.state && <option value="__other__">Other</option>}
            </select>
          ) : (
            <input type="text" id="city" name="city" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} className={errors.city ? "error" : ""} placeholder="Enter your city" autoComplete="address-level2" aria-describedby={errors.city ? "city-error" : undefined} aria-invalid={!!errors.city} autoFocus />
          )}
          {errors.city && <span id="city-error" className="form-error visible">{errors.city}</span>}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="zipCode">PIN Code <span className="required">*</span></label>
        <input type="text" id="zipCode" name="zipCode" value={form.zipCode} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6); setForm((prev) => ({ ...prev, zipCode: cleaned })); if (errors.zipCode) setErrors((prev) => { const n = { ...prev }; delete n.zipCode; return n; }); }} className={errors.zipCode ? "error" : ""} maxLength={6} inputMode="numeric" autoComplete="postal-code" aria-describedby={errors.zipCode ? "zipCode-error" : undefined} aria-invalid={!!errors.zipCode} />
        {errors.zipCode && <span id="zipCode-error" className="form-error visible">{errors.zipCode}</span>}
        {!errors.zipCode && <span className="form-hint">6-digit delivery PIN code</span>}
      </div>
    </fieldset>
  );
}

function PaymentStep({ form, errors, handleChange, setForm, setErrors, total, onRazorpayPay, processing }: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  total: number;
  onRazorpayPay: () => void;
  processing: boolean;
}) {
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
          {errors.acceptedTerms && <span id="acceptedTerms-error" className="form-error visible">{errors.acceptedTerms}</span>}
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
              <strong>₹{total.toFixed(2)}</strong>. After successful payment, your order will be placed automatically.
            </p>
            <button
              type="button"
              className="razorpay-pay-btn"
              onClick={onRazorpayPay}
              disabled={processing || total <= 0}
            >
              {processing ? "Redirecting to Razorpay..." : `Pay ₹${total.toFixed(2)} securely with Razorpay`}
            </button>
            <p className="razorpay-secure-note">🔒 Secured by Razorpay. We never store your card details.</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </fieldset>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Additional Notes</legend>
        <div className="form-group">
          <label htmlFor="notes">Order Notes (Optional)</label>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests or notes for your order" />
        </div>
      </fieldset>
      <ReturnsPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}

function StepNavigation({ currentStep, submitting, total, onNext, onPrev, isRazorpay, onRazorpayPay }: {
  currentStep: number;
  submitting: boolean;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  isRazorpay: boolean;
  onRazorpayPay: () => void;
}) {
  return (
    <div className="step-navigation">
      {currentStep > 1 && (
        <button type="button" className="btn btn-secondary step-nav-btn" onClick={onPrev}>← Back</button>
      )}
      {currentStep < 3 ? (
        <button type="button" className="btn btn-dark step-nav-btn step-nav-next" onClick={onNext}>Next — {STEP_LABELS[currentStep]}</button>
      ) : isRazorpay ? (
        <button type="button" className="btn btn-dark step-nav-btn step-nav-next" onClick={onRazorpayPay} disabled={submitting}>
          {submitting ? "Processing..." : `Pay ₹${total.toFixed(2)} with Razorpay`}
        </button>
      ) : (
        <button type="submit" className="btn btn-dark step-nav-btn step-nav-next" disabled={submitting}>
          {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}

function StickyCheckoutBar({ currentStep, submitting, total, onNext, isRazorpay, onRazorpayPay }: {
  currentStep: number;
  submitting: boolean;
  total: number;
  onNext: () => void;
  isRazorpay: boolean;
  onRazorpayPay: () => void;
}) {
  return (
    <div className="sticky-checkout-bar" aria-label="Checkout summary bar">
      <div className="sticky-checkout-bar-inner">
        <div className="sticky-checkout-info">
          <span className="sticky-checkout-label">Total</span>
          <span className="sticky-checkout-price">₹{total.toFixed(2)}</span>
        </div>
        {currentStep < 3 ? (
          <button type="button" className="btn btn-dark sticky-checkout-btn" onClick={onNext}>Next — {STEP_LABELS[currentStep]}</button>
        ) : isRazorpay ? (
          <button type="button" className="btn btn-dark sticky-checkout-btn" onClick={onRazorpayPay} disabled={submitting}>
            {submitting ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
          </button>
        ) : (
          <button type="submit" form="order-form" className="btn btn-dark sticky-checkout-btn" disabled={submitting}>
            {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const placeOrder = usePlaceOrder();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<OrderForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    transactionId: "",
    notes: "",
    acceptedTerms: false,
    paymentMethod: "razorpay",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [processing, setProcessing] = useState(false);


  const total = getTotal();
  const hasTestProduct = items.some((i) => i.sku === "0000");
  const shippingCost = hasTestProduct || total >= FREE_SHIPPING_THRESHOLD
    ? 0
    : form.state
      ? calcShippingCost(total, form.state)
      : -1;
  const grandTotal = shippingCost >= 0 ? total + shippingCost : total;

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "72px" }}>
        <section className="section order-checkout-section" aria-labelledby="empty-cart-heading">
          <SectionHeader
            subtitle="Checkout"
            title="Your Cart is Empty"
            description="Your bag is waiting — explore our collection and find something you love."
            style={{ marginBottom: "48px" }}
          />
          <div className="empty-cart-guard">
            <div className="empty-cart-icon" aria-hidden="true">🛍️</div>
            <p className="empty-cart-guard-text">
              Looks like you haven&apos;t added anything to your cart yet. Browse our
              curated collection of artisan-crafted luxury goods and bring something
              special home.
            </p>
            <div className="empty-cart-actions">
              <Link href="/catalogue" className="btn btn-primary">
                Continue Shopping
              </Link>
              <Link href="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>
            <p className="empty-cart-hint">
              Free shipping on all orders above ₹599
            </p>
          </div>
        </section>
      </div>
    );
  }

  function focusFirstError(errors: Record<string, string>) {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        (element as HTMLElement).focus();
      }
    }
  }

  function validateStep(step: number): boolean {
    const errs = runValidation(form, step);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs));
    }
    return Object.keys(errs).length === 0;
  }

  function goToNextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 3));
    }
  }

  function goToPrevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function validateAll() {
    return runValidation(form);
  }

  function getErrorMessage(err: unknown): string {
    return err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Something went wrong";
  }

  const orderPayload = {
    items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
    customerName: form.fullName.trim(),
    customerEmail: form.email.trim(),
    customerPhone: form.phone.trim(),
    addressLine1: form.address.trim(),
    addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim(),
    stateCode: form.state,
    postalCode: form.zipCode.trim(),
    customerNotes: form.notes.trim() || undefined,
  };

  async function handleRazorpayPayment() {
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs));
      return;
    }

    if (grandTotal <= 0) {
      showToast("Cart total must be greater than zero", "error");
      return;
    }

    setProcessing(true);
    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Razorpay is not configured on this site");
      }

      const Razorpay = await loadRazorpayScript();
      const createdOrder = await createRazorpayOrder({
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        receipt: `CT-${Date.now()}`,
      });

      const options = {
        key: razorpayKey,
        amount: createdOrder.amount,
        currency: createdOrder.currency,
        name: "CHINNI TREASURE",
        description: "Order Payment",
        order_id: createdOrder.order_id,
        prefill: {
          name: form.fullName.trim(),
          email: form.email.trim(),
          contact: form.phone.trim(),
        },
        theme: { color: "#1A1A1A" },
        handler: async (response: RazorpayResponse) => {
          try {
            const verification = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verification.ok) {
              showToast("Payment verification failed. Please contact support.", "error");
              setProcessing(false);
              return;
            }
            const order = await placeOrder.mutateAsync({
              ...orderPayload,
              transactionId: response.razorpay_payment_id,
            });
            clearCart();
            showToast("Payment successful! Order placed.", "success");
            router.push(`/confirmation/${order.id}`);
          } catch (err) {
            showToast(getErrorMessage(err), "error");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            showToast("Payment cancelled. You can try again.", "info");
            setProcessing(false);
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
        showToast(`Payment failed: ${response.error?.description ?? "Please try again."}`, "error");
        setProcessing(false);
      });
      rzp.open();
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
      setProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    if (form.paymentMethod === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs));
      return;
    }

    try {
      const order = await placeOrder.mutateAsync({
        ...orderPayload,
        transactionId: form.transactionId.trim(),
      });
      clearCart();
      showToast("Order placed successfully!", "success");
      router.push(`/confirmation/${order.id}`);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  return (
    <div style={{ paddingTop: "72px" }}>
      <section className="section order-checkout-section" aria-labelledby="order-heading">
        <SectionHeader
          subtitle="Checkout"
          title="Place Your Order"
          description="Fill in your delivery details and review your items before placing the order."
          style={{ marginBottom: "48px" }}
        />

        <CheckoutProgress currentStep={currentStep} />

        <div className="order-layout">
          <form id="order-form" onSubmit={handleSubmit} aria-label="Order checkout form">
            <div className="order-form-fields">
              {currentStep === 1 && <PersonalDetailsStep form={form} errors={errors} handleChange={handleChange} setForm={setForm} setErrors={setErrors} />}
              {currentStep === 2 && <DeliveryDetailsStep form={form} errors={errors} handleChange={handleChange} setForm={setForm} setErrors={setErrors} isCustomCity={isCustomCity} setIsCustomCity={setIsCustomCity} />}
              {currentStep === 3 && <PaymentStep form={form} errors={errors} handleChange={handleChange} setForm={setForm} setErrors={setErrors} total={grandTotal} onRazorpayPay={handleRazorpayPayment} processing={processing} />}

              <StepNavigation
                currentStep={currentStep}
                submitting={form.paymentMethod === "razorpay" ? processing : placeOrder.isPending}
                total={grandTotal}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
                isRazorpay={form.paymentMethod === "razorpay"}
                onRazorpayPay={handleRazorpayPayment}
              />
            </div>
          </form>

          <div className="order-summary-sidebar">
            <OrderSummaryCard
              items={items}
              total={total}
              shippingCost={shippingCost}
              grandTotal={grandTotal}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <StickyCheckoutBar
          currentStep={currentStep}
          submitting={form.paymentMethod === "razorpay" ? processing : placeOrder.isPending}
          total={grandTotal}
          onNext={goToNextStep}
          isRazorpay={form.paymentMethod === "razorpay"}
          onRazorpayPay={handleRazorpayPayment}
        />
      )}
    </div>
  );
}
