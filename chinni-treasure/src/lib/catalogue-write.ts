/**
 * Catalogue write module — the small interface that owns the duplicated
 * mutation policy of the admin write routes. Everything here is shared by
 * two or more route handlers so the policy has one home instead of N copies.
 * Throws `statusCode`-bearing errors; `withAdmin` maps them to responses.
 */
import { prisma } from "@/src/lib/prisma";

/**
 * First free slug for `base`, suffixing `-2`, `-3`, … until one is free.
 * `ignoreId` lets an update keep its own slug (the current row is allowed
 * to hold it). `ponytail: per-row `findUnique` probe — fine for the few
 * admin writes; upgrade to a `fetch count` under one query if writes ever
 * batch.
 */
export async function generateUniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let slug = base || "category";
  let attempt = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || (ignoreId !== undefined && existing.id === ignoreId)) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

/**
 * Gift box bundling cannot be enabled on products in the `box` category.
 * `ponytail: one extra `category.findUnique` when the flag is set — harmless
 * at admin write volume; pass the category in if it's ever already loaded.
 */
export async function assertGiftBoxNotOnBox(categoryId: number | null | undefined): Promise<void> {
  if (categoryId == null) return;
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true },
  });
  if (category?.slug === "box") {
    throw Object.assign(
      new Error("Gift box bundling cannot be enabled on Gift Box products"),
      { statusCode: 400 },
    );
  }
}