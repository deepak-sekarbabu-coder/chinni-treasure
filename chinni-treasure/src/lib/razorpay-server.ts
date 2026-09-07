import Razorpay from "razorpay";

/**
 * Server-side Razorpay adapter for the Order intake seam.
 *
 * The only concern of this module is resolving the *authoritative* payment
 * amount from Razorpay's own records. Client-claimed amounts are never
 * trusted: the checkout sends a payment reference, and the server looks up
 * what was actually charged before the Order intake asserts paid == stored
 * (ADR-0002).
 */

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

function createClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new RazorpayGatewayError("Payment gateway is not configured", 500);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
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
