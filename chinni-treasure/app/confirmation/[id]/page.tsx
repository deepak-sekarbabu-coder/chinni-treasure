import Link from "next/link";
import ConfirmationDetails from "@/src/components/order/ConfirmationDetails";
import { getOrderDetail } from "@/src/lib/order-cache";
import { toOrderView, type OrderView } from "@/src/lib/order-view";
import type { Metadata } from "next";

// The order-cache (30s, keyed by order id, invalidated by invalidateOrderCache)
// owns this page's freshness — ISR would serve stale HTML that no cache
// invalidation can reach, and cache one customer's order detail for everyone
// who hits the same URL. Render per request and read through the module.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Order Confirmation — Chinni Treasure",
    description:
      "Your order has been placed successfully. View your order details and tracking information.",
    alternates: {
      canonical: `/confirmation/${id}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params;

  let order: OrderView | null = null;

  try {
    const data = await getOrderDetail(id);
    if (data) order = toOrderView(data);
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
