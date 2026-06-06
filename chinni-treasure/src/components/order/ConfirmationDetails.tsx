import Link from "next/link";

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  city: string;
  stateCode: string;
  postalCode: string;
  totalAmount: number;
  transactionId: string | null;
}

export default function ConfirmationDetails({ order }: { order: OrderData }) {
  return (
    <div className="confirmation-card">
      <div className="confirmation-icon" aria-hidden="true">✓</div>
      <h1 id="confirmation-heading">Order Confirmed!</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        Thank you for your purchase.
      </p>
      <div className="order-number">
        Your Order ID
        <strong>{order.orderNumber}</strong>
      </div>

      <section className="confirmation-details" aria-labelledby="summary-heading">
        <h3 id="summary-heading">Order Summary</h3>
        <p><strong>Name:</strong> {order.customerName}</p>
        <p><strong>Email:</strong> {order.customerEmail}</p>
        <p><strong>Phone:</strong> {order.customerPhone}</p>
        <p>
          <strong>Address:</strong>{" "}
          {`${order.addressLine1}, ${order.city}, ${order.stateCode} ${order.postalCode}`}
        </p>
        {order.transactionId && (
          <p><strong>Transaction ID:</strong> {order.transactionId}</p>
        )}
        <p><strong>Total Charged:</strong> ₹{order.totalAmount.toFixed(2)}</p>
      </section>

      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px" }}>
        Your order is now <strong style={{ color: "var(--warning)" }}>pending review</strong>.
        Our team will verify your payment and confirm your order shortly.
      </p>

      <div className="confirmation-actions" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link href="/" className="btn btn-primary">Continue Shopping</Link>
        <Link href="/track" className="btn btn-secondary">Track Orders</Link>
      </div>
    </div>
  );
}
