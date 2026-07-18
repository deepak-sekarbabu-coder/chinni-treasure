import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryContent from "@/src/components/pages/category-content";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import JsonLd from "@/src/components/ui/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chinnitreasure.in";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { name: true, description: true },
    });
    if (!category) return { title: "Category Not Found — Chinni Treasure" };
    const title = `${category.name} — Chinni Treasure`;
    const description =
      category.description ||
      `Shop our ${category.name} collection at Chinni Treasure. Handcrafted luxury goods, curated by category.`;
    return {
      title,
      description,
      alternates: { canonical: `/category/${slug}` },
      openGraph: {
        title,
        description,
        url: `/category/${slug}`,
      },
    };
  } catch {
    return { title: "Category — Chinni Treasure" };
  }
}

const CATEGORY_PAGE_SIZE = 12;

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  let category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  } | null = null;
  let products: Array<{
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    imageUrl: string | null;
    description: string | null;
    stockQuantity: number;
    badge: string | null;
    category: { name: string } | null;
    categoryId: number | null;
    sku: string | null;
    isActive: boolean;
    createdAt: string;
    images?: Array<{ id: string; url: string; isPrimary: boolean; displayOrder: number }>;
  }> = [];
  let total = 0;
  let totalPages = 1;

  try {
    const found = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, description: true, isActive: true },
    });

    if (!found || !found.isActive) {
      notFound();
    }

    category = {
      id: found.id,
      name: found.name,
      slug: found.slug,
      description: found.description,
    };

    const where = {
      categoryId: found.id,
      isActive: true,
      deletedAt: null,
    };

    const [data, count] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          images: { orderBy: { displayOrder: "asc" } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: CATEGORY_PAGE_SIZE,
        skip: 0,
      }),
      prisma.product.count({ where }),
    ]);

    products = data.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      imageUrl: p.imageUrl ?? null,
      description: p.description ?? null,
      stockQuantity: p.stockQuantity,
      badge: p.badge,
      category: p.category,
      categoryId: p.categoryId,
      sku: p.sku,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      })),
    }));
    total = count;
    totalPages = Math.max(1, Math.ceil(count / CATEGORY_PAGE_SIZE));
  } catch (err) {
    console.error("Failed to fetch category page:", err);
  }

  if (!category) {
    notFound();
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: category!.name, item: `${siteUrl}/category/${category!.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: category!.name },
        ]}
      />
      <CategoryContent
        category={category!}
        initialProducts={products}
        initialTotal={total}
        initialTotalPages={totalPages}
      />
    </>
  );
}
