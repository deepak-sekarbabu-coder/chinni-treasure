import HomeContent from "@/src/components/pages/home-content";
import { loadLatestCategories } from "@/src/lib/catalogue-cache";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
  description:
    "Discover handcrafted luxury goods at Chinni Treasure. Shop artisan-crafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Chinni Treasure — Little Love | Artisan-Crafted Luxury Goods",
    description:
      "Discover handcrafted luxury goods at Chinni Treasure. Shop artisan-crafted leather accessories, silk scarves, and premium gifts with free shipping across India.",
    url: "/",
  },
};

export default async function HomePage() {
  let latestCategories: Awaited<ReturnType<typeof loadLatestCategories>> = [];

  try {
    latestCategories = await loadLatestCategories();
  } catch (err) {
    console.error("Failed to fetch latest category products:", err);
  }

  return (
    <HomeContent
      latestCategories={latestCategories}
    />
  );
}
