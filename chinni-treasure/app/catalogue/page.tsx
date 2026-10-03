import CatalogueContent from "@/src/components/pages/catalogue-content";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import JsonLd from "@/src/components/ui/JsonLd";
import { headers } from "next/headers";
import { listCatalogue, loadActiveCategories, type ActiveCategoryOption } from "@/src/lib/product-read";
import type { Metadata } from "next";
import { env } from "@/src/lib/env";

// Content depends on the request's Host header (visibleHostnames domain
// filter), so every request must render fresh — see category/[slug]/page.tsx.
export const dynamic = "force-dynamic";

const siteUrl = env.NEXT_PUBLIC_SITE_URL;

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

export default async function CataloguePage(props: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialSearch = searchParams.search || "";
  const initialCategoryId = searchParams.category ? Number.parseInt(searchParams.category, 10) : undefined;
  const validCategoryId = initialCategoryId && Number.isFinite(initialCategoryId) ? initialCategoryId : undefined;

  let products: Awaited<ReturnType<typeof listCatalogue>>["products"] = [];
  let categories: ActiveCategoryOption[] = [];
  let total = 0;

  const headersList = await headers();
  const hostname = headersList.get("host");

  // The catalogue and category options are fetched through the read module's
  // owned cache surfaces (listCatalogue / loadActiveCategories) — no inline
  // cache get/set, no bespoke keys on the module's namespaces. The search
  // param never reaches these fetches (the client re-queries /api/products),
  // so it is deliberately not part of any cache key.
  try {
    // Passed through whole: the read already returns the option shape, so the
    // page used to re-project it by hand purely to fit its own local type.
    categories = await loadActiveCategories();
    const result = await listCatalogue(hostname, validCategoryId);
    products = result.products;
    total = result.total;
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
        initialSearch={initialSearch}
        initialCategories={categories ?? []}
        initialCategoryId={validCategoryId}
      />
    </>
  );
}
