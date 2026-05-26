"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import SectionHeader from "@/src/components/ui/SectionHeader";
import CheckoutProgress from "@/src/components/order/CheckoutProgress";
import { INDIAN_STATES } from "@/src/lib/constants";

const STEP_LABELS = ["Personal Details", "Delivery Details", "Payment & Review"] as const;

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
    city: "",
    state: "",
    zipCode: "",
    transactionId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const total = getTotal();
  const shipping = 0; // Free shipping

  function validateStep(step: number): boolean {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.fullName.trim()) errs.fullName = "Full name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
      if (!form.phone.trim()) errs.phone = "Phone is required";
      else if (form.phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a valid 10-digit phone number";
    } else if (step === 2) {
      if (!form.address.trim()) errs.address = "Address is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.state) errs.state = "State/UT is required";
      if (!form.zipCode.trim()) errs.zipCode = "PIN code is required";
      else if (form.zipCode.replace(/\D/g, "").length !== 6) errs.zipCode = "Enter a valid 6-digit PIN code";
    } else if (step === 3) {
      if (!form.transactionId.trim()) errs.transactionId = "Transaction ID is required";
    }
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
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (form.phone.replace(/\D/g, "").length !== 10) errs.phone = "Enter a valid 10-digit phone number";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.state) errs.state = "State/UT is required";
    if (!form.zipCode.trim()) errs.zipCode = "PIN code is required";
    else if (form.zipCode.replace(/\D/g, "").length !== 6) errs.zipCode = "Enter a valid 6-digit PIN code";
    if (!form.transactionId.trim()) errs.transactionId = "Transaction ID is required";
    return errs;
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
      <section className="section" aria-labelledby="order-heading">
        <SectionHeader
          subtitle="Checkout"
          title="Place Your Order"
          description="Fill in your delivery details and review your items before placing the order."
          style={{ marginBottom: "48px" }}
        />

        <CheckoutProgress currentStep={currentStep} />

        <div className="order-layout">
          {/* Order Form */}
          <form id="order-form" onSubmit={handleSubmit} aria-label="Order checkout form">
            <div className="order-form-fields">
              {/* ── Step 1: Personal Details ── */}
              {currentStep === 1 && (
                <fieldset className="order-fieldset step-fade-in">
                  <legend className="order-legend">
                    Personal Details
                  </legend>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? "error" : ""}
                      placeholder="Your full name"
                    />
                    {errors.fullName && <span className="form-error visible">{errors.fullName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={errors.email ? "error" : ""}
                        placeholder="email@example.com"
                      />
                      {errors.email && <span className="form-error visible">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone <span className="required">*</span></label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm((prev) => ({ ...prev, phone: cleaned }));
                          if (errors.phone) {
                            setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
                          }
                        }}
                        className={errors.phone ? "error" : ""}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                      {errors.phone && <span className="form-error visible">{errors.phone}</span>}
                    </div>
                  </div>
                </fieldset>
              )}

              {/* ── Step 2: Delivery Details ── */}
              {currentStep === 2 && (
                <fieldset className="order-fieldset step-fade-in">
                  <legend className="order-legend">
                    Delivery Details
                  </legend>
                  <div className="form-group">
                    <label htmlFor="address">Address <span className="required">*</span></label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className={errors.address ? "error" : ""}
                      placeholder="Street address, apartment, suite, etc."
                    />
                    {errors.address && <span className="form-error visible">{errors.address}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City <span className="required">*</span></label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className={errors.city ? "error" : ""}
                        placeholder="City"
                      />
                      {errors.city && <span className="form-error visible">{errors.city}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">State/UT <span className="required">*</span></label>
                      <select
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className={errors.state ? "error" : ""}
                      >
                        <option value="">Select State/UT</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {errors.state && <span className="form-error visible">{errors.state}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">PIN Code <span className="required">*</span></label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={form.zipCode}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForm((prev) => ({ ...prev, zipCode: cleaned }));
                        if (errors.zipCode) {
                          setErrors((prev) => { const n = { ...prev }; delete n.zipCode; return n; });
                        }
                      }}
                      className={errors.zipCode ? "error" : ""}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                    />
                    {errors.zipCode && <span className="form-error visible">{errors.zipCode}</span>}
                  </div>
                </fieldset>
              )}

              {/* ── Step 3: Payment & Review ── */}
              {currentStep === 3 && (
                <>
                  <fieldset className="order-fieldset step-fade-in">
                    <legend className="order-legend">
                      Payment Details
                    </legend>
                    <div className="form-group">
                    <label htmlFor="transactionId">Transaction ID <span className="required">*</span></label>
                    <input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={form.transactionId}
                      onChange={handleChange}
                      className={errors.transactionId ? "error" : ""}
                      placeholder="Enter your payment transaction/reference ID"
                    />
                    {errors.transactionId && <span className="form-error visible">{errors.transactionId}</span>}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                        Share your payment transaction ID after completing the transfer. Our team will verify and process your order.
                      </span>
                    </div>
                  </fieldset>

                  <fieldset className="order-fieldset step-fade-in">
                    <legend className="order-legend">
                      Additional Notes
                    </legend>
                    <div className="form-group">
                      <label htmlFor="notes">Order Notes (Optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Any special requests or notes for your order"
                      />
                    </div>
                  </fieldset>
                </>
              )}

              {/* ── Step Navigation Buttons ── */}
              <div className="step-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary step-nav-btn"
                    onClick={goToPrevStep}
                  >
                    ← Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    className="btn btn-dark step-nav-btn step-nav-next"
                    onClick={goToNextStep}
                  >
                    Next — {STEP_LABELS[currentStep]}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-dark step-nav-btn step-nav-next"
                    disabled={submitting}
                  >
                    {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Cart Summary */}
          <div className="order-summary-sidebar">
            <div className="admin-stat-card order-summary-card" style={{ textAlign: "left" }}>
              {/* Desktop title — hidden on mobile */}
              <h3 className="order-summary-title order-summary-title-desktop">
                Order Summary{items.length > 0 && ` (${items.length})`}
              </h3>

              {/* Mobile toggle button — hidden on desktop */}
              <button
                type="button"
                className="order-summary-toggle"
                onClick={() => setSummaryOpen((s) => !s)}
                aria-expanded={summaryOpen}
                aria-controls="order-summary-content"
              >
                <span className="order-summary-toggle-label">
                  Order Summary
                  {items.length > 0 && (
                    <span className="order-summary-toggle-count">{items.length}</span>
                  )}
                </span>
                <svg
                  className={`order-summary-chevron${summaryOpen ? " open" : ""}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                id="order-summary-content"
                className={`order-summary-collapse${summaryOpen ? " open" : ""}`}
              >
                {items.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Your cart is empty</p>
                    <Link href="/catalogue" className="btn btn-primary">
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="order-summary-items">
                      {items.map((item) => (
                        <div key={item.productId} className="order-summary-item">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="order-summary-item-img"
                          />
                          <div className="order-summary-item-info">
                            <h4 className="order-summary-item-name">
                              {item.name}
                            </h4>
                            <p className="order-summary-item-price">
                              ₹{item.price.toFixed(2)} each
                            </p>
                            <div className="order-summary-item-qty">
                              <button
                                className="btn-secondary qty-btn"
                                onClick={() => updateQuantity(item.productId, -1)}
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <span className="qty-value">
                                {item.quantity}
                              </span>
                              <button
                                className="btn-secondary qty-btn"
                                onClick={() => updateQuantity(item.productId, 1)}
                                disabled={item.quantity >= item.stock}
                                title={
                                  item.quantity >= item.stock
                                    ? `Maximum available quantity reached (${item.stock} in stock)`
                                    : "Increase quantity"
                                }
                                aria-label={
                                  item.quantity >= item.stock
                                    ? `Maximum quantity reached for ${item.name}`
                                    : `Increase quantity for ${item.name}`
                                }
                              >
                                +
                              </button>
                              <button
                                className="order-summary-remove"
                                onClick={() => removeItem(item.productId)}
                                aria-label={`Remove ${item.name}`}
                              >
                                ✕
                              </button>
                            </div>
                            {item.quantity >= item.stock && (
                              <p
                                style={{
                                  marginTop: "6px",
                                  fontSize: "0.7rem",
                                  color: "var(--warning)",
                                  letterSpacing: "0.2px",
                                }}
                              >
                                Max available quantity reached ({item.stock} in stock)
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-summary-totals">
                      <div className="order-summary-total-row">
                        <span>Subtotal</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <div className="order-summary-total-row">
                        <span>Shipping</span>
                        <span className="order-summary-free-shipping">Free</span>
                      </div>
                      <div className="order-summary-grand-total">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Mobile Checkout Bar ── */}
      {items.length > 0 && (
        <div className="sticky-checkout-bar" aria-label="Checkout summary bar">
        <div className="sticky-checkout-bar-inner">
          <div className="sticky-checkout-info">
            <span className="sticky-checkout-label">Total</span>
            <span className="sticky-checkout-price">₹{total.toFixed(2)}</span>
          </div>
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn btn-dark sticky-checkout-btn"
              onClick={goToNextStep}
            >
              Next — {STEP_LABELS[currentStep]}
            </button>
          ) : (
            <button
              type="submit"
              form="order-form"
              className="btn btn-dark sticky-checkout-btn"
              disabled={submitting}
            >
              {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
