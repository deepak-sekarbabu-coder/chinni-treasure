import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

const MAX_LIMIT = 20;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "8", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
      : 8;

    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(products, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Failed to fetch recent products:", error);
    return NextResponse.json({ error: "Failed to fetch recent products" }, { status: 500 });
  }
}
