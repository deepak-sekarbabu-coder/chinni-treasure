"use client";

import { useCallback, useState } from "react";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/src/lib/api";
import { getErrorMessage } from "@/src/lib/api/client";
import { loadRazorpayScript } from "@/src/lib/razorpay";
import type {
  RazorpayPaymentFailedResponse,
  RazorpayResponse,
} from "@/src/types/razorpay";

export type RazorpayOutcome =
  | { ok: true; orderId: string }
  | { ok: false; reason: "cancelled" | "failed" | "error"; message: string };

export interface RazorpayPayParams {
  /** Total the gateway order is created against (the client preview total). */
  amount: number;
  /** Prefill fields for the Razorpay checkout form. */
  prefill: { name: string; email: string; contact: string };
  /**
   * Places the order once the signature verifies — the page injects its
   * mutation so this hook stays free of React Query and cart context.
   */
  placeOrder: (placement: {
    paymentGateway: "razorpay";
    transactionId: string;
    razorpayOrderId: string;
  }) => Promise<{ id: string }>;
}

/**
 * The checkout payment-capture seam. Owns the full Razorpay sequence — create
 * the gateway order, open Standard Checkout, verify the signature, then place
 * the order through the caller's mutation — and resolves with a typed outcome
 * instead of reaching into the page. The page keeps validation, toasts and
 * navigation; this was previously ~90 inline lines in app/order/page.tsx with
 * no seam to test through.
 */
export function useCheckoutPayment() {
  const [processing, setProcessing] = useState(false);

  const payWithRazorpay = useCallback(
    async (params: RazorpayPayParams): Promise<RazorpayOutcome> => {
      setProcessing(true);
      try {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
          return {
            ok: false,
            reason: "error",
            message: "Razorpay is not configured on this site",
          };
        }

        const Razorpay = await loadRazorpayScript();
        const createdOrder = await createRazorpayOrder({
          amount: params.amount,
          currency: "INR",
          receipt: `CT-${Date.now()}`,
        });

        return await new Promise<RazorpayOutcome>((resolve) => {
          const instance = new Razorpay({
            key: razorpayKey,
            amount: createdOrder.amount,
            currency: createdOrder.currency,
            name: "CHINNI TREASURE",
            description: "Order Payment",
            order_id: createdOrder.order_id,
            prefill: params.prefill,
            theme: { color: "#1A1A1A" },
            handler: async (response: RazorpayResponse) => {
              try {
                const verification = await verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                if (!verification.ok) {
                  resolve({
                    ok: false,
                    reason: "error",
                    message: "Payment verification failed. Please contact support.",
                  });
                  return;
                }
                const order = await params.placeOrder({
                  paymentGateway: "razorpay",
                  transactionId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                });
                resolve({ ok: true, orderId: order.id });
              } catch (err) {
                resolve({ ok: false, reason: "error", message: getErrorMessage(err) });
              }
            },
            modal: {
              ondismiss: () =>
                resolve({
                  ok: false,
                  reason: "cancelled",
                  message: "Payment cancelled. You can try again.",
                }),
            },
          });
          instance.on("payment.failed", (response: RazorpayPaymentFailedResponse) => {
            resolve({
              ok: false,
              reason: "failed",
              message: `Payment failed: ${response.error?.description ?? "Please try again."}`,
            });
          });
          instance.open();
        });
      } catch (err) {
        return { ok: false, reason: "error", message: getErrorMessage(err) };
      } finally {
        setProcessing(false);
      }
    },
    [],
  );

  return { processing, payWithRazorpay };
}