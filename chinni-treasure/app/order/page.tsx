"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import { INDIAN_STATES } from "@/src/lib/constants";

export default function OrderPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { showToast } = useToast();

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

  const total = getTotal();
  const shipping = 0; // Free shipping

  function validate() {
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
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    const errs = validate();
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
        <div className="section-header fade-in visible" style={{ marginBottom: "48px" }}>
          <div className="section-subtitle">Checkout</div>
          <h2 id="order-heading">Place Your Order</h2>
          <p>Fill in your delivery details and review your items before placing the order.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "48px", alignItems: "start" }}>
          {/* Order Form */}
          <form id="order-form" onSubmit={handleSubmit} aria-label="Order checkout form" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* Personal Details */}
              <fieldset style={{ border: "none", padding: 0 }}>
                <legend style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid var(--gold)", width: "100%" }}>
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

              {/* Delivery Details */}
              <fieldset style={{ border: "none", padding: 0 }}>
                <legend style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid var(--gold)", width: "100%" }}>
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

              {/* Payment Details */}
              <fieldset style={{ border: "none", padding: 0 }}>
                <legend style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid var(--gold)", width: "100%" }}>
                  Payment Details
                </legend>
                <div className="form-group">
                  <label htmlFor="transactionId">Transaction ID</label>
                  <input
                    type="text"
                    id="transactionId"
                    name="transactionId"
                    value={form.transactionId}
                    onChange={handleChange}
                    placeholder="Enter your payment transaction/reference ID"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                    Share your payment transaction ID after completing the transfer. Our team will verify and process your order.
                  </span>
                </div>
              </fieldset>

              {/* Notes */}
              <fieldset style={{ border: "none", padding: 0 }}>
                <legend style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid var(--gold)", width: "100%" }}>
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
            </div>
          </form>

          {/* Cart Summary */}
          <div style={{ position: "sticky", top: "100px" }}>
            <div className="admin-stat-card" style={{ textAlign: "left" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "24px", paddingBottom: "12px", borderBottom: "2px solid var(--cream)" }}>
                Order Summary
              </h3>

              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Your cart is empty</p>
                  <Link href="/catalogue" className="btn btn-primary">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    {items.map((item) => (
                      <div key={item.productId} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          style={{ width: "60px", height: "70px", objectFit: "cover", borderRadius: "4px" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: "0.85rem", fontFamily: "var(--font-serif)", marginBottom: "4px" }}>
                            {item.name}
                          </h4>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                            ₹{item.price.toFixed(2)} each
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: "2px 10px", fontSize: "0.7rem", minWidth: "28px", height: "28px" }}
                              onClick={() => updateQuantity(item.productId, -1)}
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              className="btn-secondary"
                              style={{ padding: "2px 10px", fontSize: "0.7rem", minWidth: "28px", height: "28px" }}
                              onClick={() => updateQuantity(item.productId, 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              +
                            </button>
                            <button
                              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.85rem" }}
                              onClick={() => removeItem(item.productId)}
                              aria-label={`Remove ${item.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid var(--cream)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Shipping</span>
                      <span style={{ color: "var(--success)" }}>Free</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 600, fontFamily: "var(--font-serif)", color: "var(--gold-dark)" }}>
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="order-form"
                    className="btn btn-dark"
                    style={{ width: "100%", marginTop: "24px" }}
                    disabled={submitting}
                  >
                    {submitting ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
