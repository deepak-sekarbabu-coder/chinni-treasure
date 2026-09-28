import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CheckoutStep,
  DeliveryDetailsStep,
  PersonalDetailsStep,
  type CheckoutState,
} from "@/src/components/order/checkout-steps";

/**
 * The steps used to be private to the route file, so nothing could render one
 * with errors and assert that the id / error-id / aria wiring agreed. That
 * contract is what these tests pin.
 */
function state(over: Partial<CheckoutState> = {}): CheckoutState {
  return {
    form: {
      fullName: "", email: "", phone: "", address: "", addressLine2: "", city: "", state: "",
      zipCode: "", transactionId: "", notes: "", acceptedTerms: false, paymentMethod: "razorpay",
    },
    setForm: vi.fn(),
    errors: {},
    setErrors: vi.fn(),
    isCustomCity: false,
    setIsCustomCity: vi.fn(),
    handleChange: vi.fn(),
    validate: () => ({}),
    orderPayload: {},
    manualOrderPayload: {},
    ...over,
  } as unknown as CheckoutState;
}

describe("checkout steps", () => {
  it("wires the error id, aria-describedby and aria-invalid to the field id", () => {
    render(<PersonalDetailsStep checkout={state({ errors: { email: "Email is required" } })} />);

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    // The described-by target must actually exist, or the announcement is a lie.
    expect(document.getElementById("email-error")).toHaveTextContent("Email is required");
  });

  it("renders a valid field with no error element and no aria-describedby", () => {
    render(<PersonalDetailsStep checkout={state()} />);

    const input = screen.getByLabelText(/Full Name/);
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(document.getElementById("fullName-error")).toBeNull();
  });

  it("clears a field's error as the user types into it", () => {
    const setErrors = vi.fn();
    render(
      <DeliveryDetailsStep
        checkout={state({
          errors: { zipCode: "PIN code is required" },
          setErrors,
          form: { ...state().form, zipCode: "40000" },
        })}
      />,
    );

    fireEvent.change(screen.getByLabelText(/PIN Code/), { target: { value: "400001" } });
    expect(setErrors).toHaveBeenCalled();
  });

  it("partitions the steps in one place: step 1 personal, step 2 delivery, step 3 payment", () => {
    const checkout = state();
    const props = { checkout, total: 100, onRazorpayPay: () => {}, processing: false };

    const { unmount } = render(<CheckoutStep step={1} {...props} />);
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    unmount();

    const delivery = render(<CheckoutStep step={2} {...props} />);
    expect(screen.getByText("Delivery Details")).toBeInTheDocument();
    delivery.unmount();

    render(<CheckoutStep step={3} {...props} />);
    expect(screen.getByText("Payment Method")).toBeInTheDocument();
  });
});
