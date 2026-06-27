# PhonePe UPI Gateway Integration — Chinni Treasure

> **Document Version:** 1.0  
> **Applies to:** Chinni Treasure — Little Love (Next.js 16, Prisma, PostgreSQL)  
> **PhonePe API Version:** v1 (Production) / v2 (Aggregator)  
> **Implementation status:** ⏳ Not implemented — This is a design/plan document. No PhonePe env vars, Prisma fields, or API routes exist in the codebase yet.
---

## Table of Contents

1. [Overview](#1-overview)
2. [Current Payment Flow](#2-current-payment-flow)
3. [PhonePe Gateway Architecture](#3-phonepe-gateway-architecture)
4. [Prerequisites](#4-prerequisites)
5. [Environment Configuration](#5-environment-configuration)
6. [PhonePe API Client Module](#6-phonepe-api-client-module)
7. [Payment Initiation API](#7-payment-initiation-api)
8. [Webhook Handler (Payment Callback)](#8-webhook-handler-payment-callback)
9. [Frontend Integration](#9-frontend-integration)
10. [Order Status Reconciliation](#10-order-status-reconciliation)
11. [Testing with PhonePe Sandbox](#11-testing-with-phonepe-sandbox)
12. [Security Considerations](#12-security-considerations)
13. [Rollback Strategy](#13-rollback-strategy)
14. [Appendix: PhonePe Payload Reference](#14-appendix-phonepe-payload-reference)

---

## 1. Overview

PhonePe's Payment Gateway allows e-commerce platforms to collect payments via UPI, Credit/Debit Cards, Net Banking, and Wallet — all through a single integration. PhonePe provides two integration models:

| Model | Description | Use Case |
|---|---|---|
| **Standard Checkout** | PhonePe hosts the payment page; redirect user to PhonePe, user authenticates, then redirected back to your site | Best for most e-commerce sites |
| **Sub-merchant (Aggregator v2)** | Platform aggregates payments for multiple merchants | Marketplace / multi-vendor platforms |

For **Chinni Treasure**, the **Standard Checkout** model is recommended. The flow:

1. Your server calls PhonePe's `/pg/v1/pay` API with order details.
2. PhonePe returns a `redirectUrl` (or `redirectUrl` via POST form).
3. The customer is redirected to PhonePe's secure payment page.
4. After payment, PhonePe redirects the customer back to your `redirectUrl` (frontend).
5. PhonePe simultaneously sends a **server-to-server webhook** (callback) to your backend with the payment result.
6. Your backend verifies the webhook payload using PhonePe's **X-VERIFY** signature and updates the order.

### Key Terminology

| Term | Meaning |
|---|---|
| **Merchant ID** | Unique ID assigned by PhonePe to your business (`MID`) |
| **API Key** | Secret key used to generate checksum (`X-VERIFY` header) |
| **Salt Key** | Part of the API Key pair (salt index) |
| **X-VERIFY** | SHA256 checksum of the payload + API Key, required in every request |
| **Merchant Transaction ID** | Your unique order reference (`merchantTransactionId`) |
| **PhonePe Transaction ID** | PhonePe's unique transaction reference |
| **Callback URL** | Server-side webhook URL where PhonePe sends payment status |
| **Redirect URL** | Frontend URL where the customer is sent after payment |

---

## 2. Current Payment Flow

The existing checkout flow works as follows:

```
Customer → Checkout Page → Views Bank Details (NEFT/IMPS/UPI ID/QR Code)
                         → Makes payment manually via their UPI app
                         → Enters Transaction ID manually in the form
                         → Places order (status = pending)
                         → Admin manually verifies payment → Approves order
```

**Limitations of the current approach:**

- ❌ No automatic payment verification — entirely manual.
- ❌ Customer must switch between apps and type back the transaction ID.
- ❌ No payment status confirmation before order submission.
- ❌ Prone to errors — customers can mistype transaction IDs.
- ❌ No retry/failure handling for payments.

**Target flow after PhonePe integration:**

```
Customer → Checkout Page → Clicks "Pay with PhonePe"
                         → Redirected to PhonePe payment page
                         → Completes payment (UPI / Card / NB / Wallet)
                         → Redirected back to confirmation page
                         → Webhook updates order status automatically (paid)
                         → Order status = confirmed (payment verified)
```

---

## 3. PhonePe Gateway Architecture

### 3.1 API Endpoints (PhonePe Production)

| Endpoint | Purpose |
|---|---|
| `POST https://api.phonepe.com/apis/hermes/pg/v1/pay` | Initiate payment (Standard Checkout) |
| `POST https://api.phonepe.com/apis/hermes/pg/v1/status/{merchantId}/{merchantTransactionId}` | Transaction status check (polling) |
| `POST https://api.phonepe.com/apis/hermes/pg/v1/refund` | Initiate refund |
| `POST https://api.phonepe.com/apis/hermes/pg/v1/refund/status/{merchantId}/{merchantTransactionId}` | Refund status check |

### 3.2 Sandbox URLs (UAT)

| Environment | Base URL |
|---|---|
| Production | `https://api.phonepe.com/apis/hermes` |
| Sandbox (UAT) | `https://api-preprod.phonepe.com/apis/hermes` |

### 3.3 Integration Architecture Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant NextJS as Chinni Treasure (Frontend)
    participant API as Next.js API Route (Backend)
    participant PhonePe as PhonePe Gateway
    participant DB as PostgreSQL

    Customer->>NextJS: 1. Fill checkout form & click "Pay"
    NextJS->>API: 2. POST /api/payment/initiate (order details)
    API->>DB: 3. Create order (status=pending_payment)
    API->>PhonePe: 4. POST /pg/v1/pay (payload + X-VERIFY)
    PhonePe-->>API: 5. Return {redirectUrl, merchantTransactionId}
    API-->>NextJS: 6. Return {redirectUrl}
    NextJS->>Customer: 7. Redirect to PhonePe payment page
    Customer->>PhonePe: 8. Complete payment (UPI/Card/NB/Wallet)
    PhonePe->>NextJS: 9. Redirect back to redirectUrl (with txnId in query)
    alt Payment Successful
        PhonePe->>API: 10. Server-to-server callback (POST /api/payment/callback)
        API->>API: 11. Verify X-VERIFY signature
        API->>DB: 12. Update order (status=confirmed, payment verified)
    end
    Customer->>NextJS: 13. Land on /confirmation/{orderId}
    API->>PhonePe: 14. Optional: GET /status to double-check
    API->>DB: 15. Fetch updated order
    NextJS-->>Customer: 16. Show confirmation with payment status
```

---

## 4. Prerequisites

### 4.1 PhonePe Merchant Account Setup

1. **Register as a PhonePe Business Merchant** at [merchant.phonepe.com](https://merchant.phonepe.com).
2. Complete KYC and onboarding.
3. From the PhonePe Merchant Dashboard, obtain:
   - **Merchant ID** (also called `MID`)
   - **API Key** (a UUID-like string)
   - **Salt Key** and **Salt Index** (used for checksum generation)
4. Configure the **Callback URL** (webhook endpoint) in the dashboard:
   - Production: `https://chinnitreasure.com/api/payment/callback`
   - Sandbox: `http://localhost:3000/api/payment/callback` (for local testing, use a tool like `ngrok`)
5. Configure the **Redirect URL** in the dashboard:
   - Production: `https://chinnitreasure.com/api/payment/redirect`
   - Sandbox: `https://chinnitreasure.com/api/payment/redirect`
6. Enable **Standard Checkout** mode (not Sub-merchant mode).

> **Note:** The Redirect URL is where customers land after payment. The Callback URL is a server-to-server endpoint. Both must be HTTPS in production.

### 4.2 Local Development Setup

For local testing, you will need a public HTTPS URL. Use **ngrok** to expose your local server:

```bash
# Install ngrok (Windows)
winget install ngrok

# Or download from https://ngrok.com/download

# Run ngrok on your Next.js dev port
ngrok http 3000

# You'll get a URL like https://abc123.ngrok.io
# Use this as your base URL in .env and PhonePe dashboard config
```

---

## 5. Environment Configuration

### 5.1 New Environment Variables

Add the following to your `.env` file:

```env
# PhonePe Gateway
PHONEPE_MERCHANT_ID=YOUR_MERCHANT_ID
PHONEPE_API_KEY=your-api-key-uuid
PHONEPE_SALT_KEY=your-salt-key-value
PHONEPE_SALT_INDEX=1
PHONEPE_ENVIRONMENT=sandbox    # "sandbox" or "production"
PHONEPE_REDIRECT_URL=https://chinnitreasure.com/api/payment/redirect
PHONEPE_CALLBACK_URL=https://chinnitreasure.com/api/payment/callback
```

### 5.2 Update `src/lib/env.ts`

Update the environment variable validation to include PhonePe config:

```typescript
// src/lib/env.ts — add PhonePe configuration
export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  JWT_SECRET: requireEnv("JWT_SECRET", process.env.NODE_ENV !== "production" ? "dev-secret" : undefined),
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "*",

  // PhonePe Gateway
  PHONEPE_MERCHANT_ID: requireEnv("PHONEPE_MERCHANT_ID"),
  PHONEPE_API_KEY: requireEnv("PHONEPE_API_KEY"),
  PHONEPE_SALT_KEY: requireEnv("PHONEPE_SALT_KEY"),
  PHONEPE_SALT_INDEX: requireEnv("PHONEPE_SALT_INDEX"),
  PHONEPE_ENVIRONMENT: process.env.PHONEPE_ENVIRONMENT || "sandbox",
  PHONEPE_CALLBACK_URL: requireEnv("PHONEPE_CALLBACK_URL"),
  PHONEPE_REDIRECT_URL: requireEnv("PHONEPE_REDIRECT_URL"),
} as const;
```

### 5.3 Update `.env.example`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chinni_treasure

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ALLOWED_ORIGIN=*

# PhonePe Gateway
PHONEPE_MERCHANT_ID=
PHONEPE_API_KEY=
PHONEPE_SALT_KEY=
PHONEPE_SALT_INDEX=1
PHONEPE_ENVIRONMENT=sandbox
PHONEPE_CALLBACK_URL=https://your-domain.com/api/payment/callback
PHONEPE_REDIRECT_URL=https://your-domain.com/api/payment/redirect
```

### 5.4 Update Prisma Schema

Add a `paymentStatus` field to the Order model to track payment-specific states separate from the fulfillment status:

```prisma
enum PaymentStatus {
  pending
  initiated
  success
  failed
  refunded
}

model Order {
  // ... existing fields ...

  paymentStatus   PaymentStatus @default(pending) @map("payment_status")
  paymentMethod   String?       @map("payment_method")          // e.g., "UPI", "CREDIT_CARD"
  phonepeTxnId    String?       @map("phonepe_txn_id")          // PhonePe transaction reference
  paymentDetails  Json?         @map("payment_details")         // Raw PhonePe callback payload

  // ... rest of existing fields ...
}
```

Then generate the migration:

```bash
npx prisma migrate dev --name add_phonepe_payment_fields
```

> **Note:** For a non-disruptive deployment, the `paymentStatus` field can default to `pending` and be `NOT NULL` so existing orders remain valid.

---

## 6. PhonePe API Client Module

Create `src/lib/phonepe.ts` — the core module that handles all PhonePe API interactions including checksum generation, payment initiation, and status verification.

### 6.1 Checksum (X-VERIFY) Generation

PhonePe requires every API request to include an `X-VERIFY` header computed as:

```
payload_base64 = base64(json_encode(payload))
checksum = sha256(payload_base64 + "/pg/v1/pay" + api_key)
x-verify = checksum + "###" + salt_index
```

```typescript
// src/lib/phonepe.ts

import { env } from "@/src/lib/env";

const BASE_URLS = {
  sandbox: "https://api-preprod.phonepe.com/apis/hermes",
  production: "https://api.phonepe.com/apis/hermes",
} as const;

function getBaseUrl(): string {
  return BASE_URLS[env.PHONEPE_ENVIRONMENT as keyof typeof BASE_URLS] ?? BASE_URLS.sandbox;
}

/**
 * Generate X-VERIFY checksum for PhonePe API requests.
 *
 * PhonePe's checksum algorithm:
 *   1. base64 encode the JSON payload
 *   2. SHA256(base64Payload + apiEndpointPath + apiKey)
 *   3. Append "###" + saltIndex
 */
export function generateChecksum(
  payload: Record<string, unknown>,
  apiEndpoint: string,
): string {
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  const checksum = require("crypto")
    .createHash("sha256")
    .update(payloadBase64 + apiEndpoint + env.PHONEPE_API_KEY)
    .digest("hex");
  return `${checksum}###${env.PHONEPE_SALT_INDEX}`;
}

/**
 * Generate X-VERIFY for the callback/webhook response verification.
 * PhonePe sends x-verify header in callbacks that needs to be validated.
 *
 * The verification process:
 *   1. Take the raw response body (JSON string)
 *   2. Append the API key
 *   3. SHA256 hash the concatenated string
 *   4. Compare with the checksum part of x-verify header
 */
export function verifyCallbackChecksum(
  responseBody: string,
  xVerifyHeader: string,
): boolean {
  const expectedChecksum = require("crypto")
    .createHash("sha256")
    .update(responseBody + env.PHONEPE_API_KEY)
    .digest("hex");
  return expectedChecksum === xVerifyHeader.split("###")[0];
}

/**
 * Generate a unique merchant transaction ID for each payment attempt.
 * Format: CT-{UUID-first-12-chars}
 */
export function generateMerchantTransactionId(): string {
  const crypto = require("crypto");
  return `CT${crypto.randomUUID().replace(/-/g, "").slice(0, 18).toUpperCase()}`;
}
```

### 6.2 Payment Initiation

```typescript
// src/lib/phonepe.ts (continued)

interface InitiatePaymentParams {
  merchantTransactionId: string;
  amount: number;            // in INR paise (e.g., ₹499 = 49900)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId: string;
  orderNumber: string;
  description?: string;
}

interface PhonePePayResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantTransactionId: string;
    transactionId: string;       // PhonePe's internal ID
    instrumentResponse: {
      redirectInfo: {
        url: string;
        method: "GET" | "POST";
      };
      type: string;
    };
  };
}

/**
 * Initiate a Standard Checkout payment with PhonePe.
 *
 * The payload structure follows PhonePe's PG v1 API:
 * - amount is in **paise** (smallest currency unit)
 * - merchantUserId is optional but recommended for recurring flows
 * - redirectUrl & callbackUrl must be HTTPS in production
 * - redirectMode can be "POST" or "REDIRECT"
 * - The response contains a redirectUrl where you send the customer
 */
export async function initiatePayment(
  params: InitiatePaymentParams,
): Promise<PhonePePayResponse> {
  const endpoint = "/pg/v1/pay";
  const url = `${getBaseUrl()}${endpoint}`;

  const payload = {
    merchantId: env.PHONEPE_MERCHANT_ID,
    merchantTransactionId: params.merchantTransactionId,
    merchantUserId: `MUID-${params.orderId.slice(0, 12)}`,
    amount: Math.round(params.amount * 100), // Convert INR to paise
    redirectUrl: env.PHONEPE_REDIRECT_URL,
    redirectMode: "POST",
    callbackUrl: env.PHONEPE_CALLBACK_URL,
    mobileNumber: params.customerPhone?.replace(/\D/g, "") || undefined,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const xVerify = generateChecksum(payload, endpoint);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      accept: "application/json",
    },
    body: JSON.stringify({ request: Buffer.from(JSON.stringify(payload)).toString("base64") }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PhonePe payment initiation failed: ${response.status} - ${errorBody}`);
  }

  const result: PhonePePayResponse = await response.json();

  if (!result.success) {
    throw new Error(`PhonePe error: ${result.code} - ${result.message}`);
  }

  return result;
}
```

### 6.3 Transaction Status Check

```typescript
// src/lib/phonepe.ts (continued)

interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: string;           // "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED"
    responseCode: string;
    paymentInstrument?: {
      type: string;
      pgTransactionId?: string;
      pgServiceTransactionId?: string;
      bankTransactionId?: string;
      utr?: string;
    };
  };
}

/**
 * Check the status of a transaction using PhonePe's status API.
 * This is useful for:
 * 1. Polling when the callback hasn't arrived yet.
 * 2. Double-verifying payment before confirming an order.
 * 3. Reconciliation jobs.
 */
export async function checkTransactionStatus(
  merchantTransactionId: string,
): Promise<PhonePeStatusResponse> {
  const endpoint = `/pg/v1/status/${env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
  const url = `${getBaseUrl()}${endpoint}`;

  const xVerify = generateChecksum({}, endpoint);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`PhonePe status check failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Map PhonePe transaction state to Chinni Treasure payment status.
 */
export function mapPhonePeStateToPaymentStatus(
  state: string,
): "success" | "failed" | "pending" {
  switch (state) {
    case "COMPLETED":
      return "success";
    case "FAILED":
    case "REVERSED":
      return "failed";
    case "PENDING":
    case "INITIATED":
    default:
      return "pending";
  }
}
```

### 6.4 Full Module Exports

```typescript
// src/lib/phonepe.ts — final exports

export {
  generateChecksum,
  verifyCallbackChecksum,
  generateMerchantTransactionId,
  initiatePayment,
  checkTransactionStatus,
  mapPhonePeStateToPaymentStatus,
};

export type {
  InitiatePaymentParams,
  PhonePePayResponse,
  PhonePeStatusResponse,
};
```

---

## 7. Payment Initiation API

Create `app/api/payment/initiate/route.ts` — the server-side endpoint that the frontend calls when the customer clicks "Pay with PhonePe".

```typescript
// app/api/payment/initiate/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { generateOrderNumber } from "@/src/lib/utils";
import { z } from "zod";
import {
  initiatePayment,
  generateMerchantTransactionId,
} from "@/src/lib/phonepe";
import { INDIAN_STATES } from "@/src/lib/constants";
import type { Prisma } from "@prisma/client";

const InitiatePaymentSchema = z.object({
  // Customer & delivery
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateCode: z
    .string()
    .length(2, "State code must be 2 characters")
    .refine((code) => INDIAN_STATES.some((s) => s.code === code), "Invalid state code"),
  postalCode: z.string().regex(/^\d{6}$/, "Postal code must be 6 digits"),
  customerNotes: z.string().optional(),

  // Cart items
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
      }),
    )
    .min(1, "At least one item is required"),
});

// POST /api/payment/initiate — Create pending order and get PhonePe redirect URL
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = InitiatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const {
      customerName, customerEmail, customerPhone,
      addressLine1, addressLine2, city, stateCode, postalCode,
      customerNotes, items,
    } = parsed.data;

    // Generate unique IDs before the transaction
    const orderNumber = generateOrderNumber();
    const merchantTransactionId = generateMerchantTransactionId();

    // Use a serializable transaction for stock consistency
    const order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Fetch fresh product data inside the transaction
        const productIds = items.map((i) => i.id);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));
        const orderItems: Array<{
          productId: string;
          productName: string;
          unitPrice: number;
          quantity: number;
        }> = [];

        let subtotal = 0;

        for (const item of items) {
          const product = productMap.get(item.id);
          if (!product) {
            return NextResponse.json(
              { error: `Product ${item.id} not found` },
              { status: 404 },
            );
          }
          if (product.stockQuantity < item.quantity) {
            return NextResponse.json(
              {
                error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
              },
              { status: 400 },
            );
          }

          orderItems.push({
            productId: product.id,
            productName: product.name,
            unitPrice: Number(product.price),
            quantity: item.quantity,
          });
          subtotal += Number(product.price) * item.quantity;
        }

        const shippingCost = 0;
        const totalAmount = subtotal + shippingCost;

        // Create the order in "pending_payment" state
        const created = await tx.order.create({
          data: {
            orderNumber,
            customerName: sanitize(customerName),
            customerEmail: sanitize(customerEmail),
            customerPhone,
            addressLine1: sanitize(addressLine1),
            addressLine2: addressLine2 ? sanitize(addressLine2) : null,
            city: sanitize(city),
            stateCode,
            postalCode,
            countryCode: "IN",
            status: "pending",          // Fulfillment status
            paymentStatus: "initiated",  // Payment status
            subtotal,
            shippingCost,
            totalAmount,
            customerNotes: customerNotes ? sanitize(customerNotes) : null,
            items: { create: orderItems },
            statusHistory: {
              create: {
                status: "pending",
                notes: "Order created — awaiting payment via PhonePe",
              },
            },
          },
          include: { items: true },
        });

        // Reserve stock (will be released if payment fails via a cron job or manual action)
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        return created;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );

    // Call PhonePe to initiate payment
    const phonepeResponse = await initiatePayment({
      merchantTransactionId,
      amount: Number(order.totalAmount),
      customerName: sanitize(customerName),
      customerEmail: sanitize(customerEmail),
      customerPhone,
      orderId: order.id,
      orderNumber,
      description: `Order ${orderNumber} - Chinni Treasure`,
    });

    // Save the PhonePe transaction reference on the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        phonepeTxnId: phonepeResponse.data?.transactionId,
        transactionId: merchantTransactionId,
        paymentDetails: phonepeResponse.data as Record<string, unknown>,
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        redirectUrl: phonepeResponse.data?.instrumentResponse.redirectInfo.url,
        merchantTransactionId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Payment initiation failed:", error);
    return NextResponse.json(
      { error: "Payment initiation failed. Please try again." },
      { status: 500 },
    );
  }
}
```

> **Important:** Since we are using `NextResponse.json()` inside the Prisma transaction callback for error cases, the actual implementation should throw exceptions instead and handle them in the outer catch block. The pattern above is simplified for illustration. See the reference code in `app/api/orders/route.ts` for the correct error-throwing pattern used in the codebase.

---

## 8. Webhook Handler (Payment Callback)

Create `app/api/payment/callback/route.ts` — the server-to-server endpoint that PhonePe calls asynchronously after payment completion.

```typescript
// app/api/payment/callback/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyCallbackChecksum, checkTransactionStatus } from "@/src/lib/phonepe";

/**
 * PhonePe payment callback handler.
 *
 * PhonePe sends a POST request to this URL after a payment is attempted.
 * The request body contains the payment result (base64-encoded JSON in the
 * `response` field), and the X-VERIFY header contains the checksum.
 *
 * CRITICAL: This endpoint must:
 *   1. Verify the X-VERIFY checksum to ensure the request is from PhonePe.
 *   2. Decode the `response` field to get payment details.
 *   3. Update the order status accordingly.
 *   4. Return a 200 response to acknowledge receipt (PhonePe will retry if
 *      it gets a non-200 response).
 */
export async function POST(request: Request) {
  try {
    // Read the raw body as text for checksum verification
    const rawBody = await request.text();

    // Get the X-VERIFY header for verification
    const xVerify = request.headers.get("x-verify");
    if (!xVerify) {
      console.error("PhonePe callback: Missing X-VERIFY header");
      return NextResponse.json({ error: "Missing X-VERIFY" }, { status: 400 });
    }

    // Verify checksum
    const isValid = verifyCallbackChecksum(rawBody, xVerify);
    if (!isValid) {
      console.error("PhonePe callback: Invalid X-VERIFY checksum");
      return NextResponse.json({ error: "Invalid checksum" }, { status: 403 });
    }

    // Parse the callback body
    let body: { response?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("PhonePe callback: Invalid JSON body");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.response) {
      console.error("PhonePe callback: Missing response field");
      return NextResponse.json({ error: "Missing response" }, { status: 400 });
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(
      Buffer.from(body.response, "base64").toString("utf-8"),
    );

    const { merchantTransactionId, state, transactionId, paymentInstrument } = decodedResponse;

    if (!merchantTransactionId) {
      console.error("PhonePe callback: Missing merchantTransactionId");
      return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
    }

    // Find the order by the merchant transaction ID
    const order = await prisma.order.findFirst({
      where: { transactionId: merchantTransactionId },
    });

    if (!order) {
      // Could be a duplicate callback or a transaction that doesn't match
      console.error(`PhonePe callback: Order not found for txn ${merchantTransactionId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on payment state
    const updateData: Record<string, unknown> = {
      phonepeTxnId: transactionId,
      paymentDetails: decodedResponse,
    };

    switch (state) {
      case "COMPLETED":
        updateData.paymentStatus = "success";
        // Optionally auto-approve the order when payment succeeds
        updateData.status = "approved";
        updateData.adminNotes = "Payment verified automatically via PhonePe";
        break;

      case "FAILED":
      case "REVERSED":
        updateData.paymentStatus = "failed";
        // Release stock since payment failed
        await releaseStockForOrder(order.id);
        updateData.adminNotes = `Payment failed: ${decodedResponse.responseCode || "Unknown error"}`;
        break;

      case "PENDING":
      case "INITIATED":
      default:
        // Payment is still pending — don't change fulfillment status
        updateData.paymentStatus = "pending";
        break;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData as any,
    });

    // Always return 200 to acknowledge the callback
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PhonePe callback handler error:", error);
    // Return 200 even on error to prevent PhonePe from retrying indefinitely
    // Log the error and handle it via reconciliation
    return NextResponse.json({ success: true, error: "Internal processing error" });
  }
}

/**
 * Release stock when a payment fails.
 */
async function releaseStockForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { productId: true, quantity: true } } },
  });

  if (!order || !order.items.length) return;

  for (const item of order.items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  }
}
```

### 8.1 Redirect Handler

Create `app/api/payment/redirect/route.ts` — the endpoint where customers land after completing payment on PhonePe.

```typescript
// app/api/payment/redirect/route.ts

import { NextResponse } from "next/server";

/**
 * Payment redirect handler.
 *
 * After the customer completes payment on PhonePe, they are redirected here.
 * PhonePe sends the payment result as form data (POST) or query parameters (GET).
 *
 * We use this endpoint to:
 *   1. Display a payment processing page.
 *   2. Poll the server-side for payment status (via the callback).
 *   3. Redirect the customer to the appropriate page.
 *
 * Note: The actual payment confirmation happens via the callback webhook.
 * This endpoint is just for customer UX — it redirects them to the order
 * confirmation page, which will check the payment status.
 */

// PhonePe can send data via POST (redirectMode=POST) or GET
export async function POST(request: Request) {
  return handleRedirect(request);
}

export async function GET(request: Request) {
  return handleRedirect(request);
}

async function handleRedirect(_request: Request) {
  // Parse form data or query params to determine the transaction
  // For simplicity, we redirect to a payment-processing page that polls status.
  // In production, you'd read the merchantTransactionId from the request.

  const url = new URL(_request.url);
  const formData = await _request.formData().catch(() => null);
  const merchantTransactionId =
    url.searchParams.get("merchantTransactionId") ||
    (formData?.get("merchantTransactionId") as string) ||
    url.searchParams.get("transactionId");

  if (merchantTransactionId) {
    // Redirect to a processing page that checks payment status
    return NextResponse.redirect(
      new URL(`/payment/processing?txn=${merchantTransactionId}`, url.origin),
      302,
    );
  }

  // Fallback: redirect to track page
  return NextResponse.redirect(new URL("/track", url.origin), 302);
}
```

### 8.2 Payment Processing Page (Frontend)

Create `app/payment/processing/page.tsx` — the page customers see after returning from PhonePe, which polls for payment status.

```tsx
// app/payment/processing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantTxnId = searchParams.get("txn");
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchantTxnId) {
      setError("No transaction reference found.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // Poll up to 30 times (~30 seconds)

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/payment/status?merchantTransactionId=${merchantTxnId}`);
        const data = await res.json();

        if (data.paymentStatus === "success") {
          setStatus("success");
          router.push(`/confirmation/${data.orderId}`);
          return;
        }

        if (data.paymentStatus === "failed") {
          setStatus("failed");
          setError(data.error || "Payment failed. Please try again.");
          return;
        }

        // Still pending — retry
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setError("Payment is taking longer than expected. Your order will be updated shortly.");
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          setError("Unable to verify payment. Please check your orders page.");
        }
      }
    };

    poll();
  }, [merchantTxnId, router]);

  return (
    <div className="payment-processing-page">
      <div className="payment-processing-card">
        {status === "checking" && (
          <>
            <div className="spinner" />
            <h1>Verifying Payment</h1>
            <p>Please wait while we confirm your payment...</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="payment-failed-icon">✕</div>
            <h1>Payment Failed</h1>
            <p>{error || "Your payment could not be processed."}</p>
            <button className="btn btn-primary" onClick={() => router.push("/order")}>
              Try Again
            </button>
          </>
        )}
        {error && status === "checking" && (
          <p className="payment-warning">{error}</p>
        )}
      </div>
    </div>
  );
}
```

### 8.3 Payment Status API (for frontend polling)

Create `app/api/payment/status/route.ts`:

```typescript
// app/api/payment/status/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkTransactionStatus, mapPhonePeStateToPaymentStatus } from "@/src/lib/phonepe";

// GET /api/payment/status?merchantTransactionId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantTransactionId = searchParams.get("merchantTransactionId");

  if (!merchantTransactionId) {
    return NextResponse.json({ error: "merchantTransactionId is required" }, { status: 400 });
  }

  try {
    // Check our local DB first
    const order = await prisma.order.findFirst({
      where: { transactionId: merchantTransactionId },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
        phonepeTxnId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // If we already have a definitive status, return it
    if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
      return NextResponse.json({
        paymentStatus: order.paymentStatus,
        orderId: order.id,
        orderStatus: order.status,
      });
    }

    // Otherwise, check with PhonePe for the latest status
    try {
      const phonepeStatus = await checkTransactionStatus(merchantTransactionId);

      if (phonepeStatus.success && phonepeStatus.data) {
        const mappedStatus = mapPhonePeStateToPaymentStatus(phonepeStatus.data.state);

        // Update our local DB
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: mappedStatus,
            paymentDetails: phonepeStatus.data as any,
            ...(mappedStatus === "success" ? {
              status: "approved",
              adminNotes: "Payment verified via PhonePe status check",
            } : {}),
          },
        });

        return NextResponse.json({
          paymentStatus: mappedStatus,
          orderId: order.id,
          orderStatus: mappedStatus === "success" ? "approved" : order.status,
        });
      }
    } catch {
      // PhonePe status check failed — return our local status
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      orderId: order.id,
      orderStatus: order.status,
    });
  } catch (error) {
    console.error("Payment status check failed:", error);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}
```

---

## 9. Frontend Integration

### 9.1 Modify the Checkout Page

The existing `app/order/page.tsx` needs to be updated to integrate the PhonePe payment flow. The key change is replacing the manual "Enter Transaction ID" step with a "Pay with PhonePe" button that triggers the payment initiation API.

**Conceptual changes required in `app/order/page.ts`:**

1. **Replace the `PaymentStep` component:** Instead of showing bank details and a transaction ID input, show a "Pay with PhonePe" button.
2. **Update the form state:** Remove `transactionId` from the form fields (it's now generated server-side).
3. **Modify `handleSubmit`:** Call `/api/payment/initiate` instead of `/api/orders` directly. Redirect the customer to the PhonePe redirect URL.
4. **Add a loading state** for the redirect.

Here's how the updated `PaymentStep` component would look:

```tsx
// Modified PaymentStep component (replacing the existing one in app/order/page.tsx)

import { buildUpiPaymentUrl } from "@/src/lib/upi";
import { QRCodeCanvas } from "qrcode.react";

function PaymentStep({
  form, errors, handleChange, setForm, setErrors, total, onPayWithPhonePe, paying,
}: {
  form: OrderForm;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<OrderForm>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  total: number;
  onPayWithPhonePe: () => void;
  paying: boolean;
}) {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <>
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Payment Method</legend>
        <div className="payment-option-card phonepe-option">
          <div className="payment-option-header">
            <div className="payment-option-info">
              <h3 className="payment-option-title">PhonePe</h3>
              <p className="payment-option-desc">
                Pay via UPI, Credit/Debit Card, Net Banking, or PhonePe Wallet
              </p>
            </div>
            <button
              type="button"
              className="btn btn-dark pay-now-btn"
              onClick={onPayWithPhonePe}
              disabled={paying}
            >
              {paying ? "Redirecting to PhonePe..." : `Pay ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </fieldset>

      {/* Optional fallback: still show UPI QR code for manual payment */}
      <fieldset className="order-fieldset step-fade-in">
        <legend className="order-legend">Or Pay via UPI (Manual)</legend>
        <div className="bank-details-card">
          {/* ... existing UPI QR code and bank details ... */}
        </div>
      </fieldset>

      {/* ... existing Terms & Conditions ... */}
    </>
  );
}
```

**Modified `handleSubmit` in the main `OrderPage` component:**

```tsx
// Inside OrderPage component — replace or modify handleSubmit

async function handlePayWithPhonePe() {
  if (items.length === 0) {
    showToast("Your cart is empty", "error");
    return;
  }

  // Validate all form fields first
  const errs = runValidation(form);
  setErrors(errs);
  if (Object.keys(errs).length > 0) {
    // If validation fails, go to the step with errors
    const errorStep = VALIDATION_RULES.find(
      (r) => errs[r.field]
    )?.step;
    if (errorStep) setCurrentStep(errorStep);
    return;
  }

  setPaying(true);
  try {
    const res = await fetch("/api/payment/initiate", {
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
        customerNotes: form.notes.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Payment initiation failed");
    }

    const data = await res.json();

    // Save the merchantTransactionId for tracking
    pendingTxnRef.current = data.merchantTransactionId;

    // Clear cart on successful initiation
    clearCart();

    // Redirect to PhonePe payment page
    window.location.href = data.redirectUrl;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    showToast(message, "error");
  } finally {
    setPaying(false);
  }
}
```

### 9.2 Add CSS for Payment Options

Add to `app/globals.css`:

```css
/* Payment Option Card */
.payment-option-card {
  background: var(--cream);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  transition: border-color 0.2s;
}

.payment-option-card:hover {
  border-color: var(--gold);
}

.payment-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.payment-option-info {
  flex: 1;
  min-width: 200px;
}

.payment-option-title {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--black);
  margin: 0 0 4px;
}

.payment-option-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.pay-now-btn {
  white-space: nowrap;
  min-width: 200px;
}

/* Payment Processing Page */
.payment-processing-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.payment-processing-card {
  text-align: center;
  max-width: 480px;
  padding: 48px 32px;
  background: var(--cream);
  border-radius: 16px;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.payment-processing-card .spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.payment-failed-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 24px;
}

.payment-warning {
  color: var(--warning);
  font-size: 0.85rem;
  margin-top: 16px;
}
```

---

## 10. Order Status Reconciliation

### 10.1 Cron Job / Scheduled Task

Since PhonePe callbacks can occasionally be delayed or missed, implement a reconciliation script that runs periodically to check the status of orders with `paymentStatus = "initiated"` or `"pending"` that are older than a threshold.

```typescript
// scripts/reconcile-payments.ts

import { prisma } from "@/src/lib/prisma";
import { checkTransactionStatus, mapPhonePeStateToPaymentStatus } from "@/src/lib/phonepe";

/**
 * Reconcile pending payments by checking with PhonePe's status API.
 *
 * Run this as a cron job every 10-15 minutes:
 *   node --import tsx scripts/reconcile-payments.ts
 */
async function reconcilePayments() {
  const staleOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ["initiated", "pending"] },
      createdAt: {
        lte: new Date(Date.now() - 30 * 60 * 1000), // Older than 30 minutes
      },
      transactionId: { not: null },
    },
    select: { id: true, transactionId: true, paymentStatus: true },
  });

  console.log(`Found ${staleOrders.length} orders to reconcile`);

  for (const order of staleOrders) {
    try {
      const status = await checkTransactionStatus(order.transactionId!);

      if (status.success && status.data) {
        const mappedStatus = mapPhonePeStateToPaymentStatus(status.data.state);

        if (mappedStatus !== order.paymentStatus) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: mappedStatus,
              paymentDetails: status.data as any,
              ...(mappedStatus === "success" ? {
                status: "approved",
                adminNotes: "Payment verified via reconciliation",
              } : mappedStatus === "failed" ? {
                adminNotes: "Payment failed (reconciled)",
              } : {}),
            },
          });
          console.log(`Updated order ${order.id}: ${order.paymentStatus} → ${mappedStatus}`);

          // Release stock if payment failed
          if (mappedStatus === "failed") {
            await releaseStockForOrder(order.id);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to reconcile order ${order.id}:`, error);
    }
  }
}

reconcilePayments().catch(console.error);
```

Add to `package.json`:

```json
{
  "scripts": {
    "reconcile:payments": "node --import tsx scripts/reconcile-payments.ts"
  }
}
```

### 10.2 Admin Panel Integration

Update the admin dashboard to show payment status alongside order status:

- In `AdminOrdersPanel.tsx`, add a `paymentStatus` column with color-coded badges.
- Allow admins to manually trigger a payment status check via the PhonePe API.
- Add a "Force Approve" button for cases where payment was received manually (offline) but the webhook failed.

### 10.3 Handling Edge Cases

| Scenario | Handling |
|---|---|
| **Callback arrives before redirect** | Order is already updated when the user lands on the redirect page. The frontend polls the status API and sees `success`, immediately redirects to confirmation. |
| **Callback never arrives** | The reconciliation cron picks it up. The customer sees a "processing" page that eventually resolves. Admin can manually verify. |
| **Callback arrives but order not found** | Logged for investigation. Could be a delayed callback for an order that was already reconciled. Respond 200 to prevent retries. |
| **Duplicate callbacks** | PhonePe may send the same callback multiple times. Use `phonepeTxnId` to detect duplicates (the second call is idempotent since the status is already updated). |
| **Payment succeeds but stock was already restored** | If a previously-failed payment later succeeds, the admin must manually adjust stock. This is rare and should trigger an alert. |
| **User closes browser during redirect** | The callback still fires server-to-server. Order is updated. Customer can track their order via the track page. |
| **User cancels on PhonePe page** | PhonePe sends a callback with `state: "FAILED"`. Stock is released. Customer sees the failure on redirect. |

---

## 11. Testing with PhonePe Sandbox

### 11.1 Sandbox Credentials

PhonePe provides a pre-production (sandbox) environment for testing:

| Parameter | Sandbox Value |
|---|---|
| Base URL | `https://api-preprod.phonepe.com/apis/hermes` |
| Test Merchant ID | Provided in your PhonePe developer dashboard |
| Test API Key | Provided in your PhonePe developer dashboard |
| Test UPI ID | `success@phonepe` (always succeeds) / `failure@phonepe` (always fails) |

### 11.2 Test Cards and UPI IDs

Use these in the PhonePe sandbox payment page:

| Scenario | Test Credential | Expected Result |
|---|---|---|
| Successful UPI | `success@phonepe` (UPI ID) | Payment succeeds, callback with `state: "COMPLETED"` |
| Failed UPI | `failure@phonepe` (UPI ID) | Payment fails, callback with `state: "FAILED"` |
| Successful Card | `4111111111111111` (Visa) + any future expiry + `123` CVV | Payment succeeds |
| Failed Card | `4000000000000002` (Visa decline) | Payment fails |
| Pending Payment | Use the PhonePe sandbox UI to simulate a pending transaction | Callback with `state: "PENDING"` |

### 11.3 Local Testing with ngrok

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Output: Forwarding https://abc123.ngrok.io -> http://localhost:3000

# Update .env:
PHONEPE_CALLBACK_URL=https://abc123.ngrok.io/api/payment/callback
PHONEPE_REDIRECT_URL=https://abc123.ngrok.io/api/payment/redirect
NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
```

> **Important:** Update the PhonePe Merchant Dashboard with the ngrok URLs for testing. PhonePe's sandbox servers need to reach your ngrok URL, so ensure ngrok is running and the URL is correct.

### 11.4 Test Script

Create a test script to verify the checksum generation and API communication:

```typescript
// src/__tests__/lib/phonepe.test.ts

import { describe, it, expect } from "vitest";
import { generateChecksum, verifyCallbackChecksum } from "@/src/lib/phonepe";

describe("PhonePe Checksum", () => {
  it("generates valid X-VERIFY header format", () => {
    const payload = { merchantId: "TEST", amount: 100 };
    const checksum = generateChecksum(payload, "/pg/v1/pay");
    expect(checksum).toMatch(/^[a-f0-9]{64}###\d+$/);
  });

  it("verifies callback checksum correctly", () => {
    const responseBody = JSON.stringify({ response: "dGVzdA==" });
    const xVerify = generateChecksum(
      JSON.parse(responseBody),
      "/pg/v1/pay",
    );
    // Simulate the x-verify header in a callback
    const isValid = verifyCallbackChecksum(responseBody, xVerify);
    expect(isValid).toBe(true);
  });

  it("rejects invalid checksum", () => {
    const isValid = verifyCallbackChecksum(
      '{"response":"test"}',
      "invalid###1",
    );
    expect(isValid).toBe(false);
  });
});
```

---

## 12. Security Considerations

### 12.1 Checksum Verification

- **Always verify** the `X-VERIFY` header on incoming callbacks. This is the only way to confirm the request genuinely came from PhonePe.
- **Never skip** checksum verification, even in development.
- The checksum uses your **API Key** — never expose this client-side.

### 12.2 HTTPS Requirement

- All PhonePe API endpoints require HTTPS. Production callback and redirect URLs must use HTTPS.
- For local development, use ngrok (which provides HTTPS).

### 12.3 Amount Manipulation Prevention

- **Always calculate the amount server-side** when initiating payment. Never trust the amount from the client.
- Store the `totalAmount` in the database when the order is created, and use that stored value when calling PhonePe.
- PhonePe returns the `amount` in the callback — verify it matches your stored value before confirming the order.

### 12.4 Idempotency

- Use `merchantTransactionId` as an idempotency key. If a payment initiation call fails (network issue), retrying with the same `merchantTransactionId` will not create duplicate transactions.
- In the callback handler, check if the payment status is already updated to prevent duplicate processing.

### 12.5 Callback Forgery Protection

- The callback endpoint (`/api/payment/callback`) does **not** require authentication — it relies entirely on `X-VERIFY` checksum verification.
- **Do not** add CSRF protection to the callback endpoint (it's a server-to-server API, not a browser endpoint).
- The redirect endpoint can have CSRF protection since it's a browser-facing page.

### 12.6 Data Privacy

- Do **not** log the full `X-VERIFY` header or API Key in logs.
- Mask sensitive customer data in payment logs.
- Store the raw PhonePe callback payload in the `paymentDetails` JSON field for audit purposes, but ensure this data is not exposed via public API responses.

### 12.7 Rate Limiting

- The payment initiation endpoint should be rate-limited to prevent abuse (e.g., max 10 requests per minute per IP).
- Use the existing rate limiter pattern from `src/lib/rate-limiter.ts`.

---

## 13. Rollback Strategy

If the PhonePe integration has issues, you can roll back to the manual payment flow:

### 13.1 Quick Rollback (Feature Flag)

Add a feature flag in `src/lib/env.ts`:

```typescript
export const env = {
  // ... existing ...
  NEXT_PUBLIC_PHONEPE_ENABLED: process.env.NEXT_PUBLIC_PHONEPE_ENABLED === "true",
  // ... rest ...
};
```

In the checkout page:

```tsx
const isPhonePeEnabled = process.env.NEXT_PUBLIC_PHONEPE_ENABLED === "true";

function PaymentStep({ ... }) {
  if (isPhonePeEnabled) {
    return <PhonePePaymentStep ... />;
  }
  return <ManualPaymentStep ... />;  // existing code
}
```

### 13.2 Full Rollback

1. Set `NEXT_PUBLIC_PHONEPE_ENABLED=false` in `.env`.
2. Remove or revert the checkout page changes.
3. Keep the `/api/payment/callback` endpoint running (it won't cause issues if no one calls it).
4. Remove PhonePe environment variables (optional).

### 13.3 Database Rollback

If the Prisma migration has been applied:

```bash
npx prisma migrate down 1
```

Or create a new migration to revert:

```bash
npx prisma migrate dev --name revert_phonepe_fields
```

---

## 14. Appendix: PhonePe Payload Reference

### 14.1 Payment Initiation Request

```json
{
  "request": "<base64-encoded-json>"
}
```

The decoded JSON inside the `request` field:

```json
{
  "merchantId": "YOUR_MERCHANT_ID",
  "merchantTransactionId": "CTABC123DEF456GHI",
  "merchantUserId": "MUID-ORDER123",
  "amount": 49900,
  "redirectUrl": "https://chinnitreasure.com/api/payment/redirect",
  "redirectMode": "POST",
  "callbackUrl": "https://chinnitreasure.com/api/payment/callback",
  "mobileNumber": "9876543210",
  "paymentInstrument": {
    "type": "PAY_PAGE"
  }
}
```

### 14.2 Payment Initiation Response (Success)

```json
{
  "success": true,
  "code": "PAYMENT_INITIATED",
  "message": "Payment initiated",
  "data": {
    "merchantTransactionId": "CTABC123DEF456GHI",
    "transactionId": "T2401011234567890123456",
    "instrumentResponse": {
      "type": "PAY_PAGE",
      "redirectInfo": {
        "url": "https://mercury-t2.phonepe.com/transact?token=YOUR_TOKEN",
        "method": "GET"
      }
    }
  }
}
```

### 14.3 Callback Payload (Success)

PhonePE POSTs to your callback URL with:

```
POST /api/payment/callback
Content-Type: application/json
X-VERIFY: <checksum>###<saltIndex>

{
  "response": "<base64-encoded-json>"
}
```

Decoded `response` value:

```json
{
  "merchantId": "YOUR_MERCHANT_ID",
  "merchantTransactionId": "CTABC123DEF456GHI",
  "transactionId": "T2401011234567890123456",
  "amount": 49900,
  "state": "COMPLETED",
  "responseCode": "SUCCESS",
  "paymentInstrument": {
    "type": "UPI",
    "pgTransactionId": "PG123456789",
    "pgServiceTransactionId": "SVC123456789",
    "bankTransactionId": "BANK123456",
    "utr": "226371829392"
  }
}
```

### 14.4 Callback Payload (Failed)

```json
{
  "merchantId": "YOUR_MERCHANT_ID",
  "merchantTransactionId": "CTABC123DEF456GHI",
  "transactionId": "T2401011234567890123456",
  "amount": 49900,
  "state": "FAILED",
  "responseCode": "PAYMENT_DECLINED",
  "paymentInstrument": {
    "type": "UPI"
  }
}
```

### 14.5 Common Response Codes

| Code | Description |
|---|---|
| `PAYMENT_INITIATED` | Payment request accepted, user redirected to PhonePe |
| `SUCCESS` | Payment completed successfully |
| `PAYMENT_DECLINED` | User declined or cancelled the payment |
| `PAYMENT_ERROR` | Technical error during payment |
| `TIMED_OUT` | Payment session expired |
| `REFUNDED` | Transaction has been refunded |

### 14.6 Transaction States

| State | Meaning |
|---|---|
| `INITIATED` | Payment request received, user is yet to complete |
| `PENDING` | Payment is being processed |
| `COMPLETED` | Payment successfully completed |
| `FAILED` | Payment failed |
| `REVERSED` | Payment was reversed (rare) |
| `REFUNDED` | Payment refunded |

---

## Quick Reference: Files to Create/Modify

### New Files

| File | Purpose |
|---|---|
| `src/lib/phonepe.ts` | Core PhonePe API client (checksum, initiate, status check) |
| `app/api/payment/initiate/route.ts` | Payment initiation API endpoint |
| `app/api/payment/callback/route.ts` | PhonePe webhook handler (server-to-server) |
| `app/api/payment/redirect/route.ts` | Post-payment redirect handler |
| `app/api/payment/status/route.ts` | Payment status polling API |
| `app/payment/processing/page.tsx` | Payment processing/verification page |
| `scripts/reconcile-payments.ts` | Payment reconciliation cron script |
| `src/__tests__/lib/phonepe.test.ts` | Unit tests for PhonePe module |

### Existing Files to Modify

| File | Changes |
|---|---|
| `src/lib/env.ts` | Add PhonePe environment variables |
| `.env.example` | Document new env vars |
| `app/order/page.tsx` | Replace manual payment step with PhonePe integration |
| `prisma/schema.prisma` | Add `paymentStatus`, `phonepeTxnId`, `paymentDetails` fields |
| `src/lib/api/schemas.ts` | Add PhonePe-related Zod schemas |
| `src/components/order/ConfirmationDetails.tsx` | Show payment status |
| `src/components/admin/AdminOrdersPanel.tsx` | Add payment status column |
| `app/globals.css` | Add payment processing page styles |
| `package.json` | Add reconciliation script entry |

---

> **Next Steps:** After reviewing this document, begin with the **Prisma schema migration** and **`src/lib/phonepe.ts`** module, as these are foundational. Then implement the API endpoints one at a time, testing each with the PhonePe sandbox before moving to the frontend changes.
