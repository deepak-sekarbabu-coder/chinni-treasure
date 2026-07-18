import HomeContent from "@/src/components/pages/home-content";
import { prisma } from "@/src/lib/prisma";
import type { Metadata } from "next";

export const revalidate = 60;

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
  let recentProducts: Array<{
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    imageUrl: string;
    description: string;
    category: { name: string } | null;
    stockQuantity: number;
    badge: string | null;
    images?: Array<{ id: string; url: string; isPrimary: boolean; displayOrder: number }>;
  }> = [];

  try {
    const data = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    recentProducts = data.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
      category: p.category,
      stockQuantity: p.stockQuantity,
      badge: p.badge,
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      })),
    }));
  } catch (err) {
    console.error("Failed to fetch recent products:", err);
  }

  return <HomeContent recentProducts={recentProducts} />;
}
