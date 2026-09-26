import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createHmac } from "crypto";
import {
  createGatewayOrder,
  verifyCheckoutSignature,
  acceptPlacementPayment,
  RazorpayGatewayError,
} from "@/src/lib/razorpay-server";

const { mockOrdersCreate, mockPaymentsFetch } = vi.hoisted(() => ({
  mockOrdersCreate: vi.fn(),
  mockPaymentsFetch: vi.fn(),
}));

vi.mock("razorpay", () => ({
  default: class {
    orders = { create: (...args: unknown[]) => mockOrdersCreate(...args) };
    payments = { fetch: (...args: unknown[]) => mockPaymentsFetch(...args) };
  },
}));

beforeAll(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_123";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
});

afterAll(() => {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
});

beforeEach(() => {
  mockOrdersCreate.mockReset();
  mockPaymentsFetch.mockReset();
});

describe("createGatewayOrder", () => {
  it("converts rupees to paise and forwards currency/receipt", async () => {
    mockOrdersCreate.mockResolvedValue({ id: "order_1", amount: 149999, currency: "INR" });

    const order = await createGatewayOrder(1499.99, { receipt: "CT-42" });

    expect(mockOrdersCreate).toHaveBeenCalledWith({
      amount: 149999,
      currency: "INR",
      receipt: "CT-42",
    });
    expect(order).toEqual({ id: "order_1", amount: 149999, currency: "INR" });
  });

  it("generates a receipt when none is given", async () => {
    mockOrdersCreate.mockResolvedValue({ id: "order_1", amount: 10000, currency: "INR" });

    await createGatewayOrder(100);

    expect(mockOrdersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ receipt: expect.any(String) }),
    );
  });

  it("rejects amounts below the minimum without contacting the gateway", async () => {
    await expect(createGatewayOrder(0.99)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockOrdersCreate).not.toHaveBeenCalled();
  });

  it("throws a not-configured error when credentials are missing", async () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_ID;
    try {
      await expect(createGatewayOrder(100)).rejects.toMatchObject({
        message: "Payment gateway is not configured",
        statusCode: 500,
      });
    } finally {
      if (keyId) process.env.RAZORPAY_KEY_ID = keyId;
    }
  });

  it("maps gateway auth failures to 401", async () => {
    mockOrdersCreate.mockRejectedValue({ statusCode: 401 });

    await expect(createGatewayOrder(100)).rejects.toMatchObject({
      message: "Payment gateway authentication failed",
      statusCode: 401,
    });
  });

  it("maps gateway failures to a typed error", async () => {
    mockOrdersCreate.mockRejectedValue(new Error("gateway down"));

    await expect(createGatewayOrder(100)).rejects.toMatchObject({
      message: "Failed to create payment order",
      statusCode: 502,
    });
  });
});

describe("verifyCheckoutSignature", () => {
  it("accepts a valid HMAC signature", () => {
    const expected = createHmac("sha256", "test_secret")
      .update("order_1|pay_1")
      .digest("hex");

    expect(verifyCheckoutSignature("order_1", "pay_1", expected)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(verifyCheckoutSignature("order_1", "pay_1", "deadbeef")).toBe(false);
  });

  it("throws when the server secret is missing", () => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;
    try {
      expect(() => verifyCheckoutSignature("order_1", "pay_1", "sig")).toThrow(
        RazorpayGatewayError,
      );
    } finally {
      if (secret) process.env.RAZORPAY_KEY_SECRET = secret;
    }
  });
});

describe("acceptPlacementPayment", () => {
  it("returns the authoritative snapshot for a captured payment on the right order", async () => {
    mockPaymentsFetch.mockResolvedValue({
      id: "pay_1",
      order_id: "order_1",
      amount: 60000,
      status: "captured",
    });

    const snapshot = await acceptPlacementPayment("pay_1", "order_1");

    expect(snapshot).toEqual({ id: "pay_1", orderId: "order_1", amount: 60000, status: "captured" });
  });

  it("accepts authorized payments too", async () => {
    mockPaymentsFetch.mockResolvedValue({
      id: "pay_1",
      order_id: "order_1",
      amount: 60000,
      status: "authorized",
    });

    await expect(acceptPlacementPayment("pay_1", "order_1")).resolves.toMatchObject({
      status: "authorized",
    });
  });

  it("rejects a payment that belongs to a different razorpay order", async () => {
    mockPaymentsFetch.mockResolvedValue({
      id: "pay_1",
      order_id: "order_OTHER",
      amount: 60000,
      status: "captured",
    });

    await expect(acceptPlacementPayment("pay_1", "order_1")).rejects.toMatchObject({
      message: expect.stringContaining("does not match this order"),
      statusCode: 400,
    });
  });

  it("rejects a payment that was not captured or authorized", async () => {
    mockPaymentsFetch.mockResolvedValue({
      id: "pay_1",
      order_id: "order_1",
      amount: 60000,
      status: "failed",
    });

    await expect(acceptPlacementPayment("pay_1", "order_1")).rejects.toMatchObject({
      message: expect.stringContaining("has not been completed"),
      statusCode: 400,
    });
  });

  it("maps a missing payment (404) to a typed gateway error", async () => {
    mockPaymentsFetch.mockRejectedValue({ statusCode: 404 });

    await expect(acceptPlacementPayment("pay_ghost", "order_1")).rejects.toMatchObject({
      message: expect.stringContaining("Payment reference not found"),
      statusCode: 400,
    });
  });
});