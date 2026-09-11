import { prisma } from "@/src/lib/prisma";
import { Prisma } from "@prisma/client";
import { domainFilterWhere } from "@/src/lib/domain-filter";

const INCLUDE = {
  category: { select: { name: true } },
  images: { orderBy: { displayOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof INCLUDE }>;

export type ProductView = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
  categoryId: number | null;
  stockQuantity: number;
  badge: string | null;
  sku: string | null;
  isActive: boolean;
  allowGiftBoxBundling?: boolean;
  createdAt: string;
  updatedAt?: string;
  images?: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

export type CatalogueProductView = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  description: string | null;
  category: { name: string } | null;
  stockQuantity: number;
  badge: string | null;
  sku: string | null;
  allowGiftBoxBundling?: boolean;
  images?: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

const DEFAULT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { stockQuantity: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
];

export const CATEGORY_SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: DEFAULT_ORDER,
  "price-asc": [{ stockQuantity: "desc" }, { price: "asc" }, { id: "asc" }],
  "price-desc": [{ stockQuantity: "desc" }, { price: "desc" }, { id: "desc" }],
};

function toProductView(row: ProductRow): ProductView {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    imageUrl: row.imageUrl ?? null,
    description: row.description ?? null,
    category: row.category,
    categoryId: row.categoryId,
    stockQuantity: row.stockQuantity,
    badge: row.badge,
    sku: row.sku,
    isActive: row.isActive,
    allowGiftBoxBundling: row.allowGiftBoxBundling,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

function toCatalogueProductView(row: ProductRow): CatalogueProductView {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : null,
    imageUrl: row.imageUrl ?? null,
    description: row.description ?? null,
    category: row.category,
    stockQuantity: row.stockQuantity,
    badge: row.badge,
    sku: row.sku,
    allowGiftBoxBundling: row.allowGiftBoxBundling,
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

export async function listCatalogue(
  hostname: string | null,
  categoryId?: number,
): Promise<{ products: CatalogueProductView[]; total: number }> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...domainFilterWhere(hostname),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: INCLUDE,
      orderBy: DEFAULT_ORDER,
      take: 6,
      skip: 0,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: rows.map(toCatalogueProductView), total };
}

export async function listByCategory(
  slug: string,
  hostname: string | null,
  opts: { page?: number; limit?: number; sort?: string } = {},
): Promise<{
  category: { id: number; name: string; slug: string; description: string | null; isActive: boolean } | null;
  products: ProductView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(60, Math.max(1, opts.limit ?? 12));
  const skip = (page - 1) * limit;

  const sortKey = opts.sort ?? "newest";
  const orderBy = CATEGORY_SORT_MAP[sortKey] ?? DEFAULT_ORDER;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, isActive: true },
  });

  if (!category || !category.isActive) {
    return { category: null, products: [], total: 0, page, limit, totalPages: 1 };
  }

  const where: Prisma.ProductWhereInput = {
    categoryId: category.id,
    isActive: true,
    deletedAt: null,
    ...domainFilterWhere(hostname),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include: INCLUDE, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  return {
    category,
    products: rows.map(toProductView),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listRecent(
  hostname: string | null,
  limit: number = 8,
): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 }, ...domainFilterWhere(hostname) },
    include: INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toProductView);
}

export async function listGiftBoxes(): Promise<
  { id: string; name: string; price: number; imageUrl: string | null; stockQuantity: number }[]
> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      stockQuantity: { gt: 0 },
      category: { slug: "box" },
    },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      stockQuantity: true,
      images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    imageUrl: p.images[0]?.url || p.imageUrl,
    stockQuantity: p.stockQuantity,
  }));
}
