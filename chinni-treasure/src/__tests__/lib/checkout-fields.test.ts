import { describe, it, expect } from "vitest";
import {
  CheckoutFields,
  fieldIssue,
  CustomerNameSchema,
  EmailSchema,
  PhoneSchema,
  AddressLine1Schema,
  CitySchema,
  StateCodeSchema,
  PostalCodeSchema,
  TransactionIdSchema,
} from "@/src/lib/checkout-fields";
import { INDIAN_STATES } from "@/src/lib/constants";

/**
 * The checkout field contract is the one copy of every rule. These tests pin
 * the contract itself — the messages here are the words both the checkout
 * form and the server 400 toasts must show.
 */
describe("checkout-fields — the shared contract", () => {
  describe("CustomerNameSchema", () => {
    it("accepts a plain name and trims surrounding whitespace", () => {
      expect(CustomerNameSchema.parse("  Asha Rao  ")).toBe("Asha Rao");
    });

    it("rejects blank with the form's required message", () => {
      const result = CustomerNameSchema.safeParse("   ");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Full name is required");
    });
  });

  describe("EmailSchema", () => {
    it("accepts a valid email", () => {
      expect(EmailSchema.parse(" asha@example.com ")).toBe("asha@example.com");
    });

    it("uses one message for both blank and invalid shape", () => {
      expect(EmailSchema.safeParse("").error?.issues[0]?.message).toBe("Email is required");
      expect(EmailSchema.safeParse("not-an-email").error?.issues[0]?.message).toBe("Invalid email address");
    });
  });

  describe("PhoneSchema", () => {
    it("accepts exactly 10 digits", () => {
      expect(PhoneSchema.parse(" 9876543210 ")).toBe("9876543210");
    });

    it("rejects blank, short, and non-numeric input with the shared messages", () => {
      expect(PhoneSchema.safeParse("").error?.issues[0]?.message).toBe("Phone is required");
      expect(PhoneSchema.safeParse("12345").error?.issues[0]?.message).toBe("Phone must be exactly 10 digits");
      expect(PhoneSchema.safeParse("98765-43210").error?.issues[0]?.message).toBe("Phone must be exactly 10 digits");
    });
  });

  describe("AddressLine1Schema / CitySchema", () => {
    it("requires non-blank address and city", () => {
      expect(AddressLine1Schema.safeParse(" ").error?.issues[0]?.message).toBe("Address is required");
      expect(CitySchema.safeParse("").error?.issues[0]?.message).toBe("City is required");
      expect(AddressLine1Schema.parse(" 12, Main St ")).toBe("12, Main St");
    });
  });

  describe("StateCodeSchema", () => {
    it("accepts a real state code from the INDIAN_STATES list", () => {
      const tn = INDIAN_STATES.find((s) => s.code === "TN");
      expect(tn).toBeDefined();
      expect(StateCodeSchema.parse("TN")).toBe("TN");
    });

    it("rejects blank, wrong length, and unknown codes with the shared messages", () => {
      expect(StateCodeSchema.safeParse("").error?.issues[0]?.message).toBe("State/UT is required");
      expect(StateCodeSchema.safeParse("T").error?.issues[0]?.message).toBe("State code must be 2 characters");
      expect(StateCodeSchema.safeParse("ZZ").error?.issues[0]?.message).toBe("Invalid state code");
    });
  });

  describe("PostalCodeSchema", () => {
    it("accepts exactly 6 digits", () => {
      expect(PostalCodeSchema.parse("600073")).toBe("600073");
    });

    it("rejects blank and wrong shapes with the shared messages", () => {
      expect(PostalCodeSchema.safeParse("").error?.issues[0]?.message).toBe("PIN code is required");
      expect(PostalCodeSchema.safeParse("12345").error?.issues[0]?.message).toBe("PIN code must be 6 digits");
      expect(PostalCodeSchema.safeParse("60007a").error?.issues[0]?.message).toBe("PIN code must be 6 digits");
    });
  });

  describe("fieldIssue", () => {
    it("returns undefined for valid values", () => {
      expect(fieldIssue("customerPhone", "9876543210")).toBeUndefined();
      expect(fieldIssue("postalCode", "600073")).toBeUndefined();
    });

    it("returns the contract message for invalid values", () => {
      expect(fieldIssue("customerPhone", "12")).toBe("Phone must be exactly 10 digits");
      expect(fieldIssue("postalCode", "abc")).toBe("PIN code must be 6 digits");
      expect(fieldIssue("customerName", "  ")).toBe("Full name is required");
    });
  });

  describe("CheckoutFields map", () => {
    it("exposes exactly the eight contract fields", () => {
      expect(Object.keys(CheckoutFields).sort()).toEqual(
        ["addressLine1", "city", "customerEmail", "customerName", "customerPhone", "postalCode", "stateCode", "transactionId"].sort(),
      );
    });
  });

  describe("TransactionIdSchema", () => {
    it("accepts a non-blank reference", () => {
      expect(TransactionIdSchema.parse("  NEFT-REF-001  ")).toBe("NEFT-REF-001");
    });

    it("rejects blank with the shared message", () => {
      expect(TransactionIdSchema.safeParse("").error?.issues[0]?.message).toBe("Transaction ID is required");
    });
  });
});
