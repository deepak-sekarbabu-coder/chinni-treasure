import { prisma } from "@/src/lib/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params;

  let order: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateCode: string;
    postalCode: string;
    countryCode: string;
    status: string;
    trackingId: string | null;
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
    transactionId: string | null;
    customerNotes: string | null;
    createdAt: string;
    items: {
      id: string;
      productName: string;
      unitPrice: number;
      quantity: number;
    }[];
  } | null = null;

  try {
    const data = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: { id: true, productName: true, unitPrice: true, quantity: true },
        },
      },
    });

    if (data) {
      order = {
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        stateCode: data.stateCode,
        postalCode: data.postalCode,
        countryCode: data.countryCode,
        status: data.status,
        trackingId: data.trackingId,
        subtotal: Number(data.subtotal),
        shippingCost: Number(data.shippingCost),
        totalAmount: Number(data.totalAmount),
        transactionId: data.transactionId,
        customerNotes: data.customerNotes,
        createdAt: data.createdAt.toISOString(),
        items: data.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          unitPrice: Number(i.unitPrice),
          quantity: i.quantity,
        })),
      };
    }
  } catch (err) {
    console.error("Failed to fetch order:", err);
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <h1>Order Not Found</h1>
          <p>We couldn&apos;t find your order. Please check your order ID.</p>
          <div className="confirmation-actions" style={{ marginTop: "24px" }}>
            <Link href="/" className="btn btn-primary">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-icon" aria-hidden="true">
          ✓
        </div>
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
          <p>
            <strong>Name:</strong> {order.customerName}
          </p>
          <p>
            <strong>Email:</strong> {order.customerEmail}
          </p>
          <p>
            <strong>Phone:</strong> {order.customerPhone}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {`${order.addressLine1}, ${order.city}, ${order.stateCode} ${order.postalCode}`}
          </p>
          {order.transactionId && (
            <p>
              <strong>Transaction ID:</strong> {order.transactionId}
            </p>
          )}
          <p>
            <strong>Total Charged:</strong> ₹{order.totalAmount.toFixed(2)}
          </p>
        </section>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "24px" }}>
          Your order is now <strong style={{ color: "var(--warning)" }}>pending review</strong>.
          Our team will verify your payment and confirm your order shortly.
        </p>

        <div className="confirmation-actions" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link href="/track" className="btn btn-secondary">
            Track Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
