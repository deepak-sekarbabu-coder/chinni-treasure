/**
 * Catalogue write module — the small interface that owns the duplicated
 * mutation policy of the admin write routes. Everything here is shared by
 * two or more route handlers so the policy has one home instead of N copies.
 * Throws `statusCode`-bearing errors; `withAdmin` maps them to responses.
 */
import { prisma } from "@/src/lib/prisma";
import type { z } from "zod";
import { sanitize } from "@/src/lib/sanitize";
import { normalizeVisibleHostnames } from "@/src/lib/domain-filter";
import { ProductInputSchema, UpdateProductInputSchema } from "@/src/lib/api/schemas";

export type CreateProductInput = z.infer<typeof ProductInputSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

/**
 * Shape a validated product payload into the Prisma `create` data. Sanitising
 * and the `undefined` → null / `null` → undefined normalisation live here so
 * the route holds no field policy.
 */
export function buildCreateData(input: CreateProductInput) {
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

/** Per-field coercion for an update; every field the client omitted is left out. */
const FIELD_MAPPERS: Record<string, (v: unknown) => unknown> = {
  sku: (v) => v,
  name: (v) => sanitize(v as string),
  categoryId: (v) => v ?? null,
  description: (v) => (v ? sanitize(v as string) : null),
  price: (v) => v,
  compareAtPrice: (v) => v ?? null,
  stockQuantity: (v) => v,
  imageUrl: (v) => v || null,
  badge: (v) => v || null,
  isActive: (v) => v,
  visibleHostnames: (v) => normalizeVisibleHostnames(v as string | null),
};

export function buildUpdateData(parsed: UpdateProductInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined && key !== "images") {
      data[key] = FIELD_MAPPERS[key] ? FIELD_MAPPERS[key](value) : value;
    }
  }
  return data;
}

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