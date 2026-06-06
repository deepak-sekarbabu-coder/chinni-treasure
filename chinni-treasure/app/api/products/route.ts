import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { sanitize } from "@/src/lib/sanitize";
import { validateCsrfOrigin } from "@/src/lib/csrf";
import { z } from "zod";
import { ProductBadge } from "@prisma/client";

const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  sku: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  badge: z.nativeEnum(ProductBadge).optional().nullable(),
});

// GET /api/products — List products (optionally paginated)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

type CreateProductInput = {
  name: string;
  price: number;
  sku?: string;
  categoryId?: number | null;
  description?: string;
  stockQuantity?: number;
  imageUrl?: string;
  badge?: ProductBadge | null;
};

function buildCreateData(input: CreateProductInput) {
  return {
    sku: input.sku || undefined,
    name: sanitize(input.name),
    categoryId: input.categoryId || null,
    description: input.description ? sanitize(input.description) : null,
    price: input.price,
    stockQuantity: input.stockQuantity ?? 0,
    imageUrl: input.imageUrl || null,
    ...(input.badge !== undefined && { badge: input.badge ?? null }),
  };
}

// POST /api/products — Create a new product (admin only)
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: buildCreateData(parsed.data),
      include: { category: { select: { name: true } } },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
