"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/src/components/cart/CartProvider";
import { useToast } from "@/src/components/ui/ToastProvider";
import SectionHeader from "@/src/components/ui/SectionHeader";
import CheckoutProgress from "@/src/components/order/CheckoutProgress";
import OrderSummaryCard from "@/src/components/order/OrderSummaryCard";
import { CheckoutStep } from "@/src/components/order/checkout-steps";
import { computePricing } from "@/src/lib/pricing";
import { cartPricedLines } from "@/src/lib/cart-projections";
import { useCheckoutForm, CHECKOUT_STEP_COUNT } from "@/src/lib/hooks/useCheckoutForm";
import { usePlaceOrder } from "@/src/lib/hooks/useAdminMutations";
import { useCheckoutPayment } from "@/src/lib/hooks/useCheckoutPayment";
import { getErrorMessage } from "@/src/lib/api/client";

import CheckoutActions from "@/src/components/order/CheckoutActions";

export default function OrderPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const placeOrder = usePlaceOrder();
  const { processing, payWithRazorpay } = useCheckoutPayment();

  const [currentStep, setCurrentStep] = useState(1);

  const checkout = useCheckoutForm(items);
  const { form, setErrors, validate, manualOrderPayload } = checkout;

  const total = getTotal();
  // Parents plus their gift-box lines, projected through the shared cart seam.
  const pricedLines = cartPricedLines(items);
  const pricing = form.state ? computePricing(pricedLines, form.state) : null;
  const shippingCost = pricing ? pricing.shippingCost : -1;
  const grandTotal = pricing ? pricing.totalAmount : total;

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
    const errs = validate(step);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs));
    }
    return Object.keys(errs).length === 0;
  }

  function goToNextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, CHECKOUT_STEP_COUNT));
    }
  }

  function goToPrevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  /** One guard entry for both submit paths: cart, fields, then total. */
  function prepareSubmit(): boolean {
    if (items.length === 0) {
      showToast("Your cart is empty", "error");
      return false;
    }
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs));
      return false;
    }
    if (grandTotal <= 0) {
      showToast("Cart total must be greater than zero", "error");
      return false;
    }
    return true;
  }

  /** One success epilogue for both submit paths. */
  function completeOrder(orderId: string, message: string) {
    clearCart();
    showToast(message, "success");
    router.push(`/confirmation/${orderId}`);
  }

  /** Manual placements carry no gateway reference for paid==stored; razorpay does (set in the hook). */

  async function handleRazorpayPayment() {
    if (!prepareSubmit()) return;

    // The capture sequence — create gateway order, open checkout, verify the
    // signature, place the order — lives behind the checkout payment seam.
    const outcome = await payWithRazorpay({
      amount: grandTotal,
      prefill: {
        name: form.fullName.trim(),
        email: form.email.trim(),
        contact: form.phone.trim(),
      },
      placeOrder: (placement) => placeOrder.mutateAsync({ ...manualOrderPayload, ...placement }),
    });

    if (outcome.ok) {
      completeOrder(outcome.orderId, "Payment successful! Order placed.");
    } else if (outcome.reason === "cancelled") {
      showToast(outcome.message, "info");
    } else {
      showToast(outcome.message, "error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.paymentMethod === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    if (!prepareSubmit()) return;

    try {
      const order = await placeOrder.mutateAsync({
        ...manualOrderPayload,
        transactionId: form.transactionId.trim(),
      });
      completeOrder(order.id, "Order placed successfully!");
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
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
              <CheckoutStep
                step={currentStep}
                checkout={checkout}
                total={grandTotal}
                onRazorpayPay={handleRazorpayPayment}
                processing={processing}
              />

              <CheckoutActions
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
        <CheckoutActions
          currentStep={currentStep}
          submitting={form.paymentMethod === "razorpay" ? processing : placeOrder.isPending}
          total={grandTotal}
          onNext={goToNextStep}
          isRazorpay={form.paymentMethod === "razorpay"}
          onRazorpayPay={handleRazorpayPayment}
          sticky
        />
      )}
    </div>
  );
}
