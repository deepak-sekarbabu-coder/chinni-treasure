function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env or see .env.example for reference.`,
    );
  }
  return value;
}

export const env = {
  get DATABASE_URL() { return requireEnv("DATABASE_URL"); },
  get JWT_SECRET() { return requireEnv("JWT_SECRET", process.env.NODE_ENV !== "production" ? "dev-secret" : undefined); },
  get NEXT_PUBLIC_SITE_URL() { return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; },
  get ALLOWED_ORIGIN() { return process.env.ALLOWED_ORIGIN || "*"; },

  // Razorpay (server-only secret; public key exposed via NEXT_PUBLIC_ prefix)
  get RAZORPAY_KEY_ID() { return requireEnv("RAZORPAY_KEY_ID"); },
  get RAZORPAY_KEY_SECRET() { return requireEnv("RAZORPAY_KEY_SECRET"); },
  get NEXT_PUBLIC_RAZORPAY_KEY_ID() { return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || requireEnv("RAZORPAY_KEY_ID"); },
} as const;
