import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Chinni Treasure",
  description:
    "Complete your order. Fill in delivery details, review your items, and place your order for artisan-crafted luxury goods.",
  alternates: {
    canonical: "/order",
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
