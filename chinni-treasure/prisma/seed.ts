import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

async function seedCategories() {
  const categories = await Promise.all(
    SEED_CATEGORIES.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: c,
        create: c,
      }),
    ),
  );
  const categoryMap: Record<string, number> = {};
  for (const cat of categories) {
    categoryMap[cat.slug] = cat.id;
  }
  return { categories, categoryMap };
}

async function seedProducts(categoryMap: Record<string, number>) {
  for (const p of SEED_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        description: p.description,
        badge: p.badge,
        categoryId: categoryMap[p.categorySlug] || null,
      },
      create: {
        sku: p.sku,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        description: p.description,
        badge: p.badge,
        categoryId: categoryMap[p.categorySlug] || null,
      },
    });

    // Create product images (upsert to handle re-seeding)
    const seenUrls = new Set<string>();
    for (let i = 0; i < p.additionalImages.length; i++) {
      const url = p.additionalImages[i];
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const existing = await prisma.productImage.findFirst({
        where: { productId: product.id, url },
      });
      if (!existing) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url,
            isPrimary: i === 0,
            displayOrder: i,
          },
        });
      }
    }
  }
}

async function seedAdmin() {
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash: hash },
    create: {
      username: "admin",
      email: "admin@chinnitreasure.com",
      passwordHash: hash,
      role: "super_admin",
    },
  });
}

async function main() {
  const { categories, categoryMap } = await seedCategories();
  await seedProducts(categoryMap);
  await seedAdmin();

  console.log("Seed completed successfully!");
  console.log(`  - ${categories.length} categories created`);
  console.log(`  - ${SEED_PRODUCTS.length} products created`);
  console.log(`  - Admin user created (admin / admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
