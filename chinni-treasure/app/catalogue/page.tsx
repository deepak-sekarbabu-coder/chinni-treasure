import { prisma } from "@/src/lib/prisma";
import CatalogueContent from "@/src/components/pages/catalogue-content";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import JsonLd from "@/src/components/ui/JsonLd";
import type { Metadata } from "next";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chinnitreasure.in";

export const metadata: Metadata = {
  title: "Collection — Chinni Treasure",
  description:
    "Browse our curated collection of artisan-crafted luxury goods. Handcrafted leather wallets, silk scarves, timepieces, and more.",
  alternates: {
    canonical: "/catalogue",
  },
  openGraph: {
    title: "Collection — Chinni Treasure",
    description:
      "Browse our curated collection of artisan-crafted luxury goods. Handcrafted leather wallets, silk scarves, timepieces, and more.",
    url: "/catalogue",
  },
};

const CATALOGUE_PAGE_SIZE = 6;

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

export default async function CataloguePage(props: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialSearch = searchParams.search || "";
  const initialCategoryId = searchParams.category ? Number.parseInt(searchParams.category, 10) : undefined;
  const validCategoryId = initialCategoryId && Number.isFinite(initialCategoryId) ? initialCategoryId : undefined;

  let products: Array<{
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
  let total = 0;
  let totalPages = 1;

  const where = {
    isActive: true,
    deletedAt: null,
    ...(validCategoryId ? { categoryId: validCategoryId } : {}),
  };

  let categories: CategoryOption[] = [];
  try {
    const [categoriesData, [productsData, count]] = await Promise.all([
      prisma.category
        .findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { displayOrder: "asc" },
        })
        .then((found) => found.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))),
      Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { name: true } },
            images: { orderBy: { displayOrder: "asc" } },
          },
          orderBy: [
            { stockQuantity: "desc" },
            { createdAt: "desc" },
            { id: "desc" },
          ],
          take: CATALOGUE_PAGE_SIZE,
          skip: 0,
        }),
        prisma.product.count({ where }),
      ]),
    ]);
    categories = categoriesData;
    products = productsData.map((p) => ({
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
    total = count;
    totalPages = Math.max(1, Math.ceil(count / CATALOGUE_PAGE_SIZE));
  } catch (err) {
    console.error("Failed to fetch catalogue data:", err);
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Collection" },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Collection" },
        ]}
      />
      <CatalogueContent
        initialProducts={products}
        initialTotal={total}
        initialTotalPages={totalPages}
        initialSearch={initialSearch}
        initialCategories={categories}
        initialCategoryId={validCategoryId}
      />
    </>
  );
}
