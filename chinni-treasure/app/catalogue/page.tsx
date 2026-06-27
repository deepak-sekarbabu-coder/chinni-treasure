import { prisma } from "@/src/lib/prisma";
import CatalogueContent from "@/src/components/pages/catalogue-content";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collection — Chinni Treasure",
  description:
    "Browse our curated collection of artisan-crafted luxury goods. Handcrafted leather wallets, silk scarves, timepieces, and more.",
};

const CATALOGUE_PAGE_SIZE = 6;

export default async function CataloguePage() {
  let products: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
    category: { name: string } | null;
    stockQuantity: number;
    badge: string | null;
    images?: Array<{ id: string; url: string; isPrimary: boolean; displayOrder: number }>;
  }> = [];
  let total = 0;
  let totalPages = 1;

  try {
    const [data, count] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: { select: { name: true } },
          images: { orderBy: { displayOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: CATALOGUE_PAGE_SIZE,
        skip: 0,
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    products = data.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
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
    total = count;
    totalPages = Math.max(1, Math.ceil(count / CATALOGUE_PAGE_SIZE));
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }

  return (
    <CatalogueContent
      initialProducts={products}
      initialTotal={total}
      initialTotalPages={totalPages}
    />
  );
}
