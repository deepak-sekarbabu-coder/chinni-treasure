import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import { buildWorkbook } from "@/src/lib/excel-export";

const BATCH_SIZE = 1000;

async function batchedFetch<T extends { id: string }>(
  findMany: (args: { take: number; skip?: number; cursor?: { id: string } }) => Promise<T[]>,
): Promise<T[]> {
  const results: T[] = [];
  let lastId: string | undefined;
  for (;;) {
    const batch = await findMany({
      take: BATCH_SIZE,
      ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
    });
    if (batch.length === 0) break;
    results.push(...batch);
    lastId = batch[batch.length - 1].id;
    if (batch.length < BATCH_SIZE) break;
  }
  return results;
}

export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [categories, products, productImages, admins] = await Promise.all([
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.product.findMany({ include: { category: true, images: { orderBy: { displayOrder: "asc" } } } }),
      batchedFetch((args) =>
        prisma.productImage.findMany({ orderBy: { createdAt: "asc" }, ...args })),
      prisma.admin.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    // ponytail: all orders/items/history are held in memory here (used to be
    // streamed into sheets in batches). Re-add per-sheet streaming if exports
    // routinely exceed ~100k rows.
    const [orders, orderItems, statusHistory] = await Promise.all([
      batchedFetch((args) =>
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, ...args })),
      batchedFetch((args) =>
        prisma.orderItem.findMany({
          include: { order: { select: { orderNumber: true } } },
          ...args,
        })),
      batchedFetch((args) =>
        prisma.orderStatusHistory.findMany({
          include: { order: { select: { orderNumber: true } } },
          ...args,
        })),
    ]);

    const workbook = buildWorkbook({ categories, products, productImages, orders, orderItems, statusHistory, admins });
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `chinni-treasure-export-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}