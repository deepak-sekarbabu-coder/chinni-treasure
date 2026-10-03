import type { MetadataRoute } from "next";
import { env } from "@/src/lib/env";
import { listSitemapCategories, listSitemapProducts } from "@/src/lib/product-read";

const BASE_URL = env.NEXT_PUBLIC_SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalogue`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/order`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/track`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    // The visibility predicate (active, not soft-deleted) is the read module's,
    // so a change to it reaches the sitemap instead of leaving it stale here.
    const products = await listSitemapProducts();

    for (const product of products) {
      entries.push({
        url: `${BASE_URL}/catalogue/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Sitemap generated without product entries on failure
  }

  try {
    const categories = await listSitemapCategories();

    for (const category of categories) {
      entries.push({
        url: `${BASE_URL}/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Sitemap generated without category entries on failure
  }

  return entries;
}
