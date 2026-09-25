import { createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import { env } from "@/src/lib/env";

/**
 * Server-side Razorpay Payment module (the gateway dialect of the Order
 * intake seam).
 *
 * Owns the whole Razorpay flow behind one interface:
 * - `createGatewayOrder` — order creation for Standard Checkout (rupees in,
 *   paise + minimum-amount policy inside)
 * - `verifyCheckoutSignature` — HMAC-SHA256 signature check
 * - `acceptPlacementPayment` — the paid==stored prologue: fetches the
 *   *authoritative* payment snapshot and applies the acceptance policy
 *   (belongs to this order, `captured`/`authorized`). Client-claimed amounts
 *   are never trusted; callers pass the gateway ids only (ADR-0002).
 *
 * Shared `RazorpayGatewayError` is how every route maps failures to HTTP
 * responses; no route knows the gateway's status vocabulary.
 */

const MIN_ORDER_AMOUNT_PAISE = 100;

export interface RazorpayPaymentSnapshot {
  /** Razorpay payment id (e.g. `pay_ABC123`). */
  id: string;
  /** Razorpay order id this payment belongs to (`order_ABC123`). */
  orderId: string;
  /** Captured amount in integer paise. */
  amount: number;
  /** Razorpay payment status (e.g. `captured`, `authorized`). */
  status: string;
}

export class RazorpayGatewayError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

function gatewayCredentials(): { keyId: string; keySecret: string } {
  let keyId: string | undefined;
  let keySecret: string | undefined;
  try {
    keyId = env.RAZORPAY_KEY_ID;
    keySecret = env.RAZORPAY_KEY_SECRET;
  } catch {
    // env throws when the variables are absent entirely.
  }
  if (!keyId || !keySecret) {
    throw new RazorpayGatewayError("Payment gateway is not configured", 500);
  }
  return { keyId, keySecret };
}

function createClient(): Razorpay {
  const { keyId, keySecret } = gatewayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Create a Razorpay order for Standard Checkout. `amount` is in rupees (the
 * Pricing domain); the paise conversion and the minimum-amount policy live
 * here, not in the checkout page or the route.
 */
export async function createGatewayOrder(
  amount: number,
  options: { currency?: string; receipt?: string } = {},
): Promise<{ id: string; amount: number; currency: string }> {
  const amountPaise = Math.round(amount * 100);
  if (amountPaise < MIN_ORDER_AMOUNT_PAISE) {
    throw new RazorpayGatewayError(`Minimum order amount is ${MIN_ORDER_AMOUNT_PAISE} paise`, 400);
  }
  const client = createClient();
  try {
    const order = await client.orders.create({
      amount: amountPaise,
      currency: options.currency ?? "INR",
      receipt: options.receipt ?? `CT-${Date.now()}`,
    });
    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  } catch (error) {
    const statusCode = (error as { statusCode?: number } | null)?.statusCode;
    if (statusCode === 401) {
      throw new RazorpayGatewayError("Payment gateway authentication failed", 401);
    }
    throw new RazorpayGatewayError("Failed to create payment order");
  }
}

/**
 * Verify the Razorpay Checkout signature: HMAC-SHA256(order_id|payment_id,
 * key_secret) compared in constant time. Returns `false` on mismatch rather
 * than throwing — a bad client signature is a failed verification, not an
 * outage. A missing server secret still throws (config error).
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = gatewayCredentials();
  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/**
 * Fetch a payment from Razorpay by id and return its authoritative snapshot.
 * Throws `RazorpayGatewayError` when the gateway is unreachable or the
 * payment does not exist.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentSnapshot> {
  const client = createClient();
  try {
    const payment = (await client.payments.fetch(paymentId)) as {
      id: string;
      order_id: string;
      amount: number;
      status: string;
    };
    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      status: payment.status,
    };
  } catch (error) {
    const statusCode = (error as { statusCode?: number } | null)?.statusCode;
    if (statusCode === 404) {
      throw new RazorpayGatewayError("Payment reference not found with the gateway", 400);
    }
    if (statusCode === 401) {
      throw new RazorpayGatewayError("Payment gateway authentication failed", 500);
    }
    throw new RazorpayGatewayError("Failed to verify payment with the gateway");
  }
}

/**
 * The paid==stored prologue: resolve the authoritative snapshot for a
 * placement and apply the acceptance policy — the payment must belong to the
 * given Razorpay order and be `captured`/`authorized`. Returns the snapshot
 * (callers use `amount`) or throws a typed `RazorpayGatewayError`. Callers
 * never decide what "accepted" means.
 */
export async function acceptPlacementPayment(
  paymentId: string,
  razorpayOrderId: string,
): Promise<RazorpayPaymentSnapshot> {
  const payment = await fetchRazorpayPayment(paymentId);
  if (payment.orderId !== razorpayOrderId) {
    throw new RazorpayGatewayError("Payment does not match this order. Please contact support.", 400);
  }
  if (payment.status !== "captured" && payment.status !== "authorized") {
    throw new RazorpayGatewayError(
      "Payment has not been completed. Please try again or contact support.",
      400,
    );
  }
  return payment;
}