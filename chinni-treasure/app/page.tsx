import HomeContent from "@/src/components/pages/home-content";
import { prisma } from "@/src/lib/prisma";
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
  let latestCategories: Array<{
    category: { id: number; name: string; slug: string };
    product: {
      id: string;
      name: string;
      price: number;
      compareAtPrice?: number | null;
      imageUrl: string | null;
      description: string | null;
      stockQuantity: number;
      badge: string | null;
      images?: Array<{ id: string; url: string; isPrimary: boolean; displayOrder: number }>;
    };
  }> = [];

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            name: true,
            price: true,
            compareAtPrice: true,
            imageUrl: true,
            description: true,
            stockQuantity: true,
            badge: true,
            images: {
              orderBy: { displayOrder: "asc" },
              take: 1,
              select: {
                id: true,
                url: true,
                isPrimary: true,
                displayOrder: true,
              },
            },
          },
        },
      },
    });

    latestCategories = categories
      .filter((c) => c.products.length > 0)
      .map((c) => {
        const [product] = c.products;
        return {
          category: { id: c.id, name: c.name, slug: c.slug },
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice
              ? Number(product.compareAtPrice)
              : null,
            imageUrl: product.imageUrl ?? null,
            description: product.description ?? null,
            stockQuantity: product.stockQuantity,
            badge: product.badge ?? null,
            images: product.images.map((img) => ({
              id: img.id,
              url: img.url,
              isPrimary: img.isPrimary,
              displayOrder: img.displayOrder,
            })),
          },
        };
      });
  } catch (err) {
    console.error("Failed to fetch latest category products:", err);
  }

  return (
    <HomeContent
      latestCategories={latestCategories}
    />
  );
}
