import type { RazorpayConstructor } from "@/src/types/razorpay";

/**
 * Loads the Razorpay Standard Checkout script (idempotent).
 * Resolves with the Razorpay constructor once available on `window`.
 */
export function loadRazorpayScript(): Promise<RazorpayConstructor> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay is only available in the browser"));
      return;
    }
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay!));
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout script")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay!);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}
