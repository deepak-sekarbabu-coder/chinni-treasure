export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFailedResponse {
  error: {
    code: string;
    description: string;
    reason: string;
    source: string;
    step: string;
    metadata: Record<string, string>;
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string; backdrop_close?: boolean };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    backdropclose?: boolean;
    escape?: boolean;
    animation?: boolean;
  };
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: "payment.failed", handler: (response: RazorpayPaymentFailedResponse) => void): void;
  on(event: string, handler: (response: unknown) => void): void;
}

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export {};
