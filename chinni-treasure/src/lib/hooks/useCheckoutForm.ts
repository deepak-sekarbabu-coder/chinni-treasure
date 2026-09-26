import { useState } from "react";
import { fieldIssue, type CheckoutFieldKey } from "@/src/lib/checkout-fields";

export interface OrderForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  transactionId: string;
  notes: string;
  acceptedTerms: boolean;
  paymentMethod: "razorpay" | "manual";
}

const FORM_FIELD_RULES: Array<{
  field: keyof OrderForm;
  contractField: CheckoutFieldKey | null;
  step: number;
  message: string;
}> = [
  { field: "fullName", contractField: "customerName", step: 1, message: "Full name is required" },
  { field: "email", contractField: "customerEmail", step: 1, message: "Email is required" },
  { field: "phone", contractField: "customerPhone", step: 1, message: "Phone is required" },
  { field: "address", contractField: "addressLine1", step: 2, message: "Address is required" },
  { field: "city", contractField: "city", step: 2, message: "City is required" },
  { field: "state", contractField: "stateCode", step: 2, message: "State/UT is required" },
  { field: "zipCode", contractField: "postalCode", step: 2, message: "PIN code is required" },
  { field: "acceptedTerms", contractField: null, step: 3, message: "You must accept the terms and conditions" },
  { field: "transactionId", contractField: "transactionId", step: 3, message: "Transaction ID is required" },
];

function runValidation(form: OrderForm, step?: number): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const rule of FORM_FIELD_RULES) {
    if (step !== undefined && rule.step !== step) continue;
    // The bank-ref input only renders for manual payments; the gateway
    // supplies the reference on the Razorpay path. Validating it there
    // demands a field the user can never see or fill.
    if (rule.field === "transactionId" && form.paymentMethod !== "manual") continue;
    const value = form[rule.field];
    if (rule.contractField === null) {
      if (typeof value === "string" ? !value.trim() : !value) errors[rule.field] = rule.message;
      continue;
    }
    if (typeof value !== "string") continue;
    const message = value.trim() === "" ? rule.message : fieldIssue(rule.contractField, value);
    if (message) errors[rule.field] = message;
  }
  return errors;
}

const initialForm: OrderForm = {
  fullName: "", email: "", phone: "", address: "", addressLine2: "", city: "", state: "",
  zipCode: "", transactionId: "", notes: "", acceptedTerms: false, paymentMethod: "razorpay",
};

export function useCheckoutForm(items: Array<{
  productId: string;
  quantity: number;
  isGift?: boolean;
  giftBoxes?: Array<{ productId: string; quantity: number }>;
}>) {
  const [form, setForm] = useState<OrderForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCustomCity, setIsCustomCity] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  }

  const orderPayload = {
    items: items.filter((i) => !i.isGift).map((i) => ({
      id: i.productId,
      quantity: i.quantity,
      giftBoxes: i.giftBoxes?.map((gb) => ({ id: gb.productId, quantity: gb.quantity })),
    })),
    customerName: form.fullName.trim(), customerEmail: form.email.trim(), customerPhone: form.phone.trim(),
    addressLine1: form.address.trim(), addressLine2: form.addressLine2.trim() || undefined,
    city: form.city.trim(), stateCode: form.state, postalCode: form.zipCode.trim(),
    customerNotes: form.notes.trim() || undefined,
  };

  return {
    form, setForm, errors, setErrors, isCustomCity, setIsCustomCity, handleChange,
    validate: (step?: number) => runValidation(form, step),
    orderPayload,
    manualOrderPayload: { ...orderPayload, paymentGateway: "manual" as const },
  };
}
