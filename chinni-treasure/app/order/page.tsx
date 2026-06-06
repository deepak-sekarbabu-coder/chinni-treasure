"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import SectionHeader from "@/src/components/ui/SectionHeader";
import CheckoutProgress from "@/src/components/order/CheckoutProgress";
import OrderSummaryCard from "@/src/components/order/OrderSummaryCard";
import { INDIAN_STATES } from "@/src/lib/constants";

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
  { field: "transactionId", step: 3, test: (f) => !f.transactionId.trim() ? "Transaction ID is required" : undefined },
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
        <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className={errors.fullName ? "error" : ""} placeholder="Your full name" />
        {errors.fullName && <span className="form-error visible">{errors.fullName}</span>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email <span className="required">*</span></label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className={errors.email ? "error" : ""} placeholder="email@example.com" />
          {errors.email && <span className="form-error visible">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone <span className="required">*</span></label>
          <input type="tel" id="phone" name="phone" value={form.phone} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10); setForm((prev) => ({ ...prev, phone: cleaned })); if (errors.phone) setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }} className={errors.phone ? "error" : ""} placeholder="9876543210" maxLength={10} />
          {errors.phone && <span className="form-error visible">{errors.phone}</span>}
        </div>
      </div>
    </fieldset>
  );
}

function DeliveryDetailsStep({ form, errors, handleChange, setForm, setErrors }: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <fieldset className="order-fieldset step-fade-in">
      <legend className="order-legend">Delivery Details</legend>
      <div className="form-group">
        <label htmlFor="address">Address <span className="required">*</span></label>
        <input type="text" id="address" name="address" value={form.address} onChange={handleChange} className={errors.address ? "error" : ""} placeholder="Street address, apartment, suite, etc." />
        {errors.address && <span className="form-error visible">{errors.address}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="addressLine2">Apartment, Suite, Landmark <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(Optional)</span></label>
        <input type="text" id="addressLine2" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Apartment, suite, floor, landmark, etc." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City <span className="required">*</span></label>
          <input type="text" id="city" name="city" value={form.city} onChange={handleChange} className={errors.city ? "error" : ""} placeholder="City" />
          {errors.city && <span className="form-error visible">{errors.city}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="state">State/UT <span className="required">*</span></label>
          <select id="state" name="state" value={form.state} onChange={handleChange} className={errors.state ? "error" : ""}>
            <option value="">Select State/UT</option>
            {INDIAN_STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
          </select>
          {errors.state && <span className="form-error visible">{errors.state}</span>}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="zipCode">PIN Code <span className="required">*</span></label>
        <input type="text" id="zipCode" name="zipCode" value={form.zipCode} onChange={(e) => { const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6); setForm((prev) => ({ ...prev, zipCode: cleaned })); if (errors.zipCode) setErrors((prev) => { const n = { ...prev }; delete n.zipCode; return n; }); }} className={errors.zipCode ? "error" : ""} placeholder="6-digit PIN code" maxLength={6} />
        {errors.zipCode && <span className="form-error visible">{errors.zipCode}</span>}
      </div>
    </fieldset>
  );
}

function PaymentStep({ form, errors, handleChange, setForm, setErrors }: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [policyOpen, setPolicyOpen] = useState(false);
  return (
    <>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Payment Details</legend>
        <div className="form-group">
          <label htmlFor="transactionId">Transaction ID <span className="required">*</span></label>
          <input type="text" id="transactionId" name="transactionId" value={form.transactionId} onChange={handleChange} className={errors.transactionId ? "error" : ""} placeholder="Enter your payment transaction/reference ID" />
          {errors.transactionId && <span className="form-error visible">{errors.transactionId}</span>}
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>Share your payment transaction ID after completing the transfer. Our team will verify and process your order.</span>
        </div>
      </fieldset>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Additional Notes</legend>
        <div className="form-group">
          <label htmlFor="notes">Order Notes (Optional)</label>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests or notes for your order" />
        </div>
      </fieldset>
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
                Returns Policy
              </button>
              . I understand that all sales are final, no returns or refunds will be issued, and payment must be completed before order processing.
            </span>
          </label>
          {errors.acceptedTerms && <span className="form-error visible">{errors.acceptedTerms}</span>}
        </div>
      </fieldset>
      <ReturnsPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}

function StepNavigation({ currentStep, submitting, total, onNext, onPrev }: {
  currentStep: number;
  submitting: boolean;
  total: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="step-navigation">
      {currentStep > 1 && (
        <button type="button" className="btn btn-secondary step-nav-btn" onClick={onPrev}>← Back</button>
      )}
      {currentStep < 3 ? (
        <button type="button" className="btn btn-dark step-nav-btn step-nav-next" onClick={onNext}>Next — {STEP_LABELS[currentStep]}</button>
      ) : (
        <button type="submit" className="btn btn-dark step-nav-btn step-nav-next" disabled={submitting}>
          {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
        </button>
      )}
    </div>
  );
}

function StickyCheckoutBar({ currentStep, submitting, total, onNext }: {
  currentStep: number;
  submitting: boolean;
  total: number;
  onNext: () => void;
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

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);


  const total = getTotal();

  function validateStep(step: number): boolean {
    const errs = runValidation(form, step);
    setErrors(errs);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
          customerName: form.fullName.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
          addressLine1: form.address.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          stateCode: form.state,
          postalCode: form.zipCode.trim(),
          transactionId: form.transactionId.trim() || undefined,
          customerNotes: form.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place order");
      }

      const order = await res.json();
      clearCart();
      showToast("Order placed successfully!", "success");
      router.push(`/confirmation/${order.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
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
              {currentStep === 2 && <DeliveryDetailsStep form={form} errors={errors} handleChange={handleChange} setForm={setForm} setErrors={setErrors} />}
              {currentStep === 3 && <PaymentStep form={form} errors={errors} handleChange={handleChange} setForm={setForm} setErrors={setErrors} />}

              <StepNavigation
                currentStep={currentStep}
                submitting={submitting}
                total={total}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
              />
            </div>
          </form>

          <div className="order-summary-sidebar">
            <OrderSummaryCard
              items={items}
              total={total}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <StickyCheckoutBar
          currentStep={currentStep}
          submitting={submitting}
          total={total}
          onNext={goToNextStep}
        />
      )}
    </div>
  );
}
