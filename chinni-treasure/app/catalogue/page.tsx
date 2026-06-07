import { prisma } from "@/src/lib/prisma";
import CatalogueContent from "../catalogue-content";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Collection — Chinni Treasure",
  description:
    "Browse our curated collection of artisan-crafted luxury goods. Handcrafted leather wallets, silk scarves, timepieces, and more.",
};

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
  }> = [];

  try {
    const data = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    products = data.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.imageUrl ?? "",
      description: p.description ?? "",
      category: p.category,
      stockQuantity: p.stockQuantity,
      badge: p.badge,
    }));
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }

  return <CatalogueContent initialProducts={products} />;
}
