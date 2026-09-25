import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sanitize } from "@/src/lib/sanitize";
import { validateOr400 } from "@/src/lib/validate";
import { invalidateCatalogCaches, SORT_OPTIONS, type SortKey } from "@/src/lib/catalogue-cache";
import { withAdmin } from "@/src/lib/admin-route";
import { checkAuth } from "@/src/lib/auth";
import { z } from "zod";
import { ProductBadge } from "@prisma/client";
import { getHostFromRequest, normalizeVisibleHostnames } from "@/src/lib/domain-filter";
import { parseListQuery } from "@/src/lib/list-query";
import { assertGiftBoxNotOnBox } from "@/src/lib/catalogue-write";
import { listProductsForQuery, type ProductStatusFilter } from "@/src/lib/product-read";

const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive("Compare at price must be positive").optional().nullable(),
  sku: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.nativeEnum(ProductBadge).optional().nullable(),
  isActive: z.boolean().optional(),
  visibleHostnames: z.string().optional(),
  allowGiftBoxBundling: z.boolean().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        isPrimary: z.boolean().optional().default(false),
        displayOrder: z.number().int().min(0).optional().default(0),
      }),
    )
    .optional(),
});

// GET /api/products — List products (optionally paginated). The active
// catalogue is public; `isActive=all|inactive` requires an admin session.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = parseListQuery(searchParams, {
      defaultLimit: 10,
      maxLimit: 100,
      defaultSort: "newest",
      sortMap: SORT_OPTIONS,
    });
    if (parsedQuery instanceof NextResponse) return parsedQuery;
    const { page, limit, skip } = parsedQuery;
    const isActiveParam = searchParams.get("isActive");
    const status: ProductStatusFilter =
      isActiveParam === "all" || isActiveParam === "inactive" ? isActiveParam : "active";

    // Only the active catalogue is public. `all` / `inactive` is the admin
    // panel's view of the catalogue, so it is gated here — at the one seam
    // both audiences read through — rather than inside any branch the module
    // owns. Without this an anonymous caller could enumerate inactive products
    // by appending a query param.
    if (status !== "active" && !(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawCategoryId = searchParams.get("categoryId");
    const payload = await listProductsForQuery(getHostFromRequest(request), {
      page,
      limit,
      skip,
      status,
      search: searchParams.get("search") || "",
      categoryId: rawCategoryId ? Number.parseInt(rawCategoryId, 10) : undefined,
      badge: searchParams.get("badge") || "",
      sort: (parsedQuery.sort ?? "newest") as SortKey,
    });

    return NextResponse.json(
      payload,
      // The admin responses are keyed by URL alone, which says nothing about
      // the session that was allowed to see them — a shared edge cache would
      // hand them to anonymous callers.
      status === "active"
        ? { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
        : { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

type CreateProductInput = {
  name: string;
  price: number;
  compareAtPrice?: number | null;
  sku?: string;
  categoryId?: number | null;
  description?: string;
  stockQuantity?: number;
  imageUrl?: string;
  badge?: ProductBadge | null;
  isActive?: boolean;
  visibleHostnames?: string;
  allowGiftBoxBundling?: boolean;
  images?: Array<{ url: string; isPrimary?: boolean; displayOrder?: number }>;
};

function buildCreateData(input: CreateProductInput) {
  return {
    sku: input.sku || undefined,
    name: sanitize(input.name),
    categoryId: input.categoryId ?? null,
    description: input.description ? sanitize(input.description) : null,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    stockQuantity: input.stockQuantity ?? 0,
    imageUrl: input.imageUrl || null,
    ...(input.badge !== undefined && { badge: input.badge ?? null }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    ...(input.visibleHostnames !== undefined && { visibleHostnames: normalizeVisibleHostnames(input.visibleHostnames) }),
    ...(input.allowGiftBoxBundling !== undefined && { allowGiftBoxBundling: input.allowGiftBoxBundling }),
  };
}

// POST /api/products — Create a new product (admin only)
export const POST = withAdmin(
  async ({ body }) => {
    const parsed = validateOr400(CreateProductSchema, body);
    if (!parsed.ok) return parsed.response;

    const { images, allowGiftBoxBundling, ...productData } = parsed.data;

    if (allowGiftBoxBundling) {
      await assertGiftBoxNotOnBox(productData.categoryId ?? null);
    }

    const product = await prisma.product.create({
      data: {
        ...buildCreateData({ ...productData, allowGiftBoxBundling } as CreateProductInput),
        images: images && images.length > 0
          ? {
            create: images.map((img, idx) => ({
              url: img.url,
              isPrimary: img.isPrimary ?? idx === 0,
              displayOrder: img.displayOrder ?? idx,
            })),
          }
          : undefined,
      },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
    });

    await invalidateCatalogCaches();

    return NextResponse.json(product, { status: 201 });
  },
  {
    parseBody: true,
    revalidateCatalogue: true,
    fallbackError: "Failed to create product",
    errorMessages: {
      p2002: (target) => `A product with this ${target} already exists`,
    },
  },
);
