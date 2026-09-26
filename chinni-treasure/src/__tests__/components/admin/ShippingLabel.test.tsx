import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ShippingLabel, { type ProductRow } from "../../../components/admin/ShippingLabel";

const products: ProductRow[] = [
  { orderId: "SKU1", styleCode: "Gold Ring", actualPrice: 1200, sellPrice: 1000, qty: 2 },
  { orderId: "SKU2", styleCode: "Silver Bangle", actualPrice: 0, sellPrice: 500, qty: 1 },
];

type LabelProps = Parameters<typeof ShippingLabel>[0];

function renderLabel(overrides?: Partial<LabelProps>) {
  return render(
    <ShippingLabel
      displayPackDate="12/09/2026"
      courierName="Delhivery Pvt Ltd"
      paymentMode="Prepaid"
      paymentAmount={2100}
      invoiceId="CH20260101"
      awbNumber=""
      recipientName="Test User"
      recipientPhone="9876543210"
      recipientAddress="10 Test Street"
      recipientCity="Chennai"
      recipientPincode="600001"
      products={products}
      {...overrides}
    />,
  );
}

describe("ShippingLabel", () => {
  it("renders courier, payment, invoice and recipient details", () => {
    renderLabel();
    expect(screen.getByText("Delhivery Pvt Ltd")).toBeInTheDocument();
    expect(screen.getByText("CH20260101")).toBeInTheDocument();
    expect(screen.getByText("Prepaid")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText(/Ph No: 9876543210/)).toBeInTheDocument();
  });

  it("renders product rows with discounted and plain prices", () => {
    renderLabel();
    expect(screen.getByText("SKU1 | Gold Ring")).toBeInTheDocument();
    expect(screen.getByText("₹1200.00")).toBeInTheDocument();
    expect(screen.getByText("₹1000.00")).toBeInTheDocument();
    expect(screen.getByText("SKU2 | Silver Bangle")).toBeInTheDocument();
    expect(screen.getByText("₹500.00")).toBeInTheDocument();
  });

  it("shows the AWB block when an AWB number is present", () => {
    renderLabel({ awbNumber: "AWB1234567" });
    expect(screen.getAllByText("AWB1234567")).toHaveLength(2);
    expect(screen.getByText("AWB Number")).toBeInTheDocument();
  });
});