import HomeContent from "@/src/components/pages/home-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
  description:
    "Discover handcrafted luxury goods at Chinni Treasure. Shop artisan-crafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
  openGraph: {
    title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
    description:
      "Discover handcrafted luxury goods at Chinni Treasure. Shop artisan-crafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
    url: "/",
  },
};

export default async function HomePage() {
  return <HomeContent />;
}
