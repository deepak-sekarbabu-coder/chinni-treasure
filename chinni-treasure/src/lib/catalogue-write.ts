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
import { isGiftBoxCategory } from "@/src/lib/gift-box";
import { normalizeImageSet, type ImageSetEntry } from "@/src/lib/image-set";
import {
  CreateCategorySchema,
  ProductInputSchema,
  UpdateCategorySchema,
  UpdateProductInputSchema,
} from "@/src/lib/api/schemas";
import { slugify } from "@/src/lib/utils";

export type CreateProductInput = z.infer<typeof ProductInputSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

/** The row shape both admin product write routes answer with. */
export const PRODUCT_WRITE_INCLUDE = {
  category: { select: { name: true } },
  images: { orderBy: { displayOrder: "asc" } },
} as const;

/**
 * Shape a validated product payload into the Prisma `create` data. Sanitising,
 * the `undefined` → null / `null` → undefined normalisation, and the gallery
 * (nested so it is one atomic insert) live here so the route holds no field
 * policy.
 */
export function buildCreateData(input: CreateProductInput) {
  const images = input.images ? normalizeImageSet(input.images) : [];
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
    ...(images.length > 0 && { images: { create: images } }),
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
 * The whole admin product update in one call: gallery replace, gift-box guard,
 * SKU-unique re-patch, then the row write. The route used to re-patch the
 * module's output itself (drop an unchanged `sku` to dodge the unique index,
 * re-attach `allowGiftBoxBundling`) — policy that only existed at the adapter.
 */
export async function updateProduct(id: string, parsed: UpdateProductInput) {
  const { images, allowGiftBoxBundling, ...fields } = parsed;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { sku: true, categoryId: true },
  });

  if (allowGiftBoxBundling) {
    await assertGiftBoxNotOnBox(existing?.categoryId ?? null);
  }
  if (images !== undefined) {
    await replaceProductImages(id, images);
  }

  const data = buildUpdateData(fields) as Record<string, unknown>;
  if (data.sku !== undefined && data.sku === existing?.sku) delete data.sku;
  if (allowGiftBoxBundling !== undefined) data.allowGiftBoxBundling = allowGiftBoxBundling;

  return prisma.product.update({
    where: { id },
    data: data as Parameters<typeof prisma.product.update>[0]["data"],
    include: PRODUCT_WRITE_INCLUDE,
  });
}

/**
 * Soft-delete a product: stamp `deletedAt` rather than dropping the row, so
 * historical OrderItems keep their snapshot and the product leaves every
 * catalogue read (which filters `deletedAt: null`) in one place.
 *
 * The route held this inline, which made it the one catalogue write that
 * reached past this module into Prisma — the same shape that leaked the
 * SKU-unique re-patch and the gift-box re-attach into the adapter.
 */
export async function softDeleteProduct(id: string) {
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
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
  if (isGiftBoxCategory(category)) {
    throw Object.assign(
      new Error("Gift box bundling cannot be enabled on Gift Box products"),
      { statusCode: 400 },
    );
  }
}

/**
 * Create a category: sanitised fields plus the first free slug, derived from
 * the explicit slug when given and from the name otherwise. The route used to
 * hold that choice and the sanitising inline.
 */
export async function createCategory(input: CreateCategoryInput) {
  const baseSlug = input.slug ? slugify(input.slug) : slugify(input.name);
  return prisma.category.create({
    data: {
      name: sanitize(input.name),
      slug: await generateUniqueSlug(baseSlug),
      description: input.description ? sanitize(input.description) : null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

/** Update a category; omitted fields stay out, a new slug keeps its own row free. */
export async function updateCategory(id: number, input: UpdateCategoryInput) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = sanitize(input.name);
  if (input.description !== undefined) {
    data.description = input.description ? sanitize(input.description) : null;
  }
  if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.slug !== undefined) data.slug = await generateUniqueSlug(slugify(input.slug), id);

  return prisma.category.update({
    where: { id },
    data: data as Parameters<typeof prisma.category.update>[0]["data"],
  });
}

/**
 * Delete a category, refusing while any non-deleted product still points at
 * it. The guard was inline in the route, so it was the one write with a
 * bespoke 409 body; the module now throws a `statusCode` error like the rest.
 */
export async function deleteCategory(id: number) {
  const productCount = await prisma.product.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (productCount > 0) {
    throw Object.assign(
      new Error(
        `Cannot delete category. ${productCount} active product(s) still belong to it. Reassign or delete them first.`,
      ),
      { statusCode: 409 },
    );
  }
  await prisma.category.delete({ where: { id } });
}

// ponytail: atomic replace in one $transaction; two awaits left a window with zero images on crash.
export async function replaceProductImages(
  productId: string,
  images: readonly Partial<ImageSetEntry>[],
): Promise<void> {
  const imageSet = normalizeImageSet(images);
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    ...(imageSet.length > 0
      ? [prisma.productImage.createMany({ data: imageSet.map((img) => ({ productId, ...img })) })]
      : []),
  ]);
}