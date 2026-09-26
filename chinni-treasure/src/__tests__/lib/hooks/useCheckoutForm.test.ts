import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutForm } from "../../../lib/hooks/useCheckoutForm";

const valid = {
  fullName: "Asha Rao",
  email: "asha@example.com",
  phone: "9876543210",
  address: "12 MG Road",
  city: "Bengaluru",
  state: "KA",
  zipCode: "560001",
  acceptedTerms: true,
};

describe("useCheckoutForm transactionId rule", () => {
  it("requires transactionId for manual payments", () => {
    const { result } = renderHook(() => useCheckoutForm([]));
    act(() => {
      result.current.setForm((f) => ({ ...f, ...valid, transactionId: "", paymentMethod: "manual" }));
    });
    expect(result.current.validate().transactionId).toBe("Transaction ID is required");
  });

  it("skips transactionId for razorpay payments", () => {
    const { result } = renderHook(() => useCheckoutForm([]));
    act(() => {
      result.current.setForm((f) => ({ ...f, ...valid, transactionId: "", paymentMethod: "razorpay" }));
    });
    expect(result.current.validate().transactionId).toBeUndefined();
  });
});
