import HomeContent from "@/src/components/pages/home-content";
import { listLatestPerCategory } from "@/src/lib/product-read";
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
  // Left undefined on failure, not `[]`: the block's own client fetch is the
  // recovery path, and an empty array would read as "no categories" and render
  // an empty section instead.
  let latestCategories: Awaited<ReturnType<typeof listLatestPerCategory>> | undefined;

  try {
    latestCategories = await listLatestPerCategory();
  } catch (err) {
    console.error("Failed to fetch latest category products:", err);
  }

  return (
    <HomeContent
      latestCategories={latestCategories}
    />
  );
}
