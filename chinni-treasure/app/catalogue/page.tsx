import { prisma } from "@/src/lib/prisma";
import CatalogueContent from "@/src/components/pages/catalogue-content";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import JsonLd from "@/src/components/ui/JsonLd";
import { headers } from "next/headers";
import { listCatalogue } from "@/src/lib/product-read";
import { productsCache, categoriesCache } from "@/src/lib/catalogue-cache";
import type { Metadata } from "next";

// Content depends on the request's Host header (visibleHostnames domain
// filter), so every request must render fresh — see category/[slug]/page.tsx.
export const dynamic = "force-dynamic";

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

  let products: Awaited<ReturnType<typeof listCatalogue>>["products"] = [];
  let categories: CategoryOption[] = [];
  let total = 0;
  let totalPages = 1;

  const headersList = await headers();
  const hostname = headersList.get("host");

  const cacheKeySuffix = `${hostname ?? "default"}:${validCategoryId ?? "all"}`;
  const { get: getCachedProducts, set: setProductsCache } = productsCache;
  const { get: getCachedCategories, set: setCategoriesCache } = categoriesCache;

  try {
    const cachedCategories = (await getCachedCategories(`cats:${cacheKeySuffix}`)) as CategoryOption[] | null;
    if (cachedCategories) {
      categories = cachedCategories;
    } else {
      const categoriesData = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { displayOrder: "asc" },
      });
      categories = categoriesData.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
      await setCategoriesCache(`cats:${cacheKeySuffix}`, categories);
    }

    const productCacheKey = `cat:${cacheKeySuffix}:${initialSearch || "nosearch"}`;
    const cached = (await getCachedProducts(productCacheKey)) as { products: typeof products; total: number } | null;

    if (cached) {
      products = cached.products;
      total = cached.total;
    } else {
      const result = await listCatalogue(hostname, validCategoryId);
      products = result.products;
      total = result.total;

      await setProductsCache(productCacheKey, { products, total });
    }

    totalPages = Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE));
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
        initialCategories={categories ?? []}
        initialCategoryId={validCategoryId}
      />
    </>
  );
}
