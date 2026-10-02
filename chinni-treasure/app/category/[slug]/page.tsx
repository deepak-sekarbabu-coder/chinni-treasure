import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getCategoryBySlug, listByCategory } from "@/src/lib/product-read";
import CategoryContent from "@/src/components/pages/category-content";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import JsonLd from "@/src/components/ui/JsonLd";
import { env } from "@/src/lib/env";

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

// Content depends on the request's Host header (visibleHostnames domain
// filter), so every request must render fresh — ISR/static rendering would
// both crash on headers() and serve one host's filtered view to another.
export const dynamic = "force-dynamic";

/**
 * The category identity comes from the read module, which owns the cache key
 * and the `categories` tag `invalidateCatalogCaches()` clears — it used to be a
 * page-local `unstable_cache` here, so the tag name had no module owner.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const category = await getCategoryBySlug(slug);
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

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  let category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  } | null = null;
  let products: Awaited<ReturnType<typeof listByCategory>>["products"] = [];
  let total = 0;

  try {
    const headersList = await headers();
    const hostname = headersList.get("host");

    const result = await listByCategory(slug, hostname);

    if (!result.category) {
      notFound();
    }

    category = result.category;
    products = result.products;
    total = result.total;
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
      />
    </>
  );
}
