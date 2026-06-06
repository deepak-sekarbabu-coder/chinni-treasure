import { prisma } from "@/src/lib/prisma";
import Link from "next/link";
import ConfirmationDetails from "@/src/components/order/ConfirmationDetails";

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
      <ConfirmationDetails order={order} />
    </div>
  );
}
