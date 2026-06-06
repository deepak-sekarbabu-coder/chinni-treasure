import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Order — Chinni Treasure",
  description:
    "Track your order status using your Order ID or phone number. View real-time updates on your luxury goods purchase.",
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
