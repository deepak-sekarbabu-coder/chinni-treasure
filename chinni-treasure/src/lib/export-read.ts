import { prisma } from "@/src/lib/prisma";

/**
 * The export read surface — the one place that answers "give me the whole
 * database" for `buildWorkbook`.
 *
 * Two adapters consume it (`GET /api/export` and `scripts/export-to-excel.ts`),
 * which is what makes this a real seam rather than a hypothetical one. Row
 * shapes come from the Prisma payloads, so a schema change breaks the typecheck
 * instead of silently dropping a column from the export.
 */

const BATCH_SIZE = 1000;

/** Cursor-paginate one table so a large export doesn't hold a single unbounded query. */
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

/** The db client the dump needs — overridable so tests and the script can pass their own. */
type ExportDb = Pick<
  typeof prisma,
  "category" | "product" | "productImage" | "order" | "orderItem" | "orderStatusHistory" | "admin"
>;

export type ExportData = Awaited<ReturnType<typeof dumpDatabase>>;

/**
 * Dump every table the Excel export writes.
 *
 * `ponytail: all rows are held in memory (it used to stream per sheet) —
 * re-add streaming if exports routinely exceed ~100k rows.`
 */
export async function dumpDatabase(db: ExportDb = prisma) {
  const [categories, products, productImages, admins] = await Promise.all([
    db.category.findMany({ orderBy: { displayOrder: "asc" } }),
    db.product.findMany({
      include: { category: true, images: { orderBy: { displayOrder: "asc" } } },
    }),
    batchedFetch((args) =>
      db.productImage.findMany({ orderBy: { createdAt: "asc" }, ...args }),
    ),
    db.admin.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const [orders, orderItems, statusHistory] = await Promise.all([
    batchedFetch((args) => db.order.findMany({ orderBy: { createdAt: "desc" }, ...args })),
    batchedFetch((args) =>
      db.orderItem.findMany({
        include: { order: { select: { orderNumber: true } } },
        ...args,
      }),
    ),
    batchedFetch((args) =>
      db.orderStatusHistory.findMany({
        include: { order: { select: { orderNumber: true } } },
        ...args,
      }),
    ),
  ]);

  return { categories, products, productImages, orders, orderItems, statusHistory, admins };
}