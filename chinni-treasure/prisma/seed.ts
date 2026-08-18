import "dotenv/config";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_ORDERS } from "./seed-data";

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

async function seedProducts(categoryMap: Record<string, number>): Promise<Record<string, string>> {
  const skuMap: Record<string, string> = {};
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
        ...(p.isActive !== undefined ? { isActive: p.isActive } : {}),
        visibleHostnames: p.visibleHostnames ?? null,
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
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
        isActive: p.isActive ?? true,
        visibleHostnames: p.visibleHostnames ?? null,
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      },
    });
    skuMap[p.sku] = product.id;

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
  return skuMap;
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

async function seedOrders(skuMap: Record<string, string>) {
  for (const o of SEED_ORDERS) {
    const order = await prisma.order.upsert({
      where: { orderNumber: o.orderNumber },
      update: {
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        addressLine1: o.addressLine1,
        addressLine2: o.addressLine2,
        city: o.city,
        stateCode: o.stateCode,
        postalCode: o.postalCode,
        countryCode: o.countryCode,
        status: o.status as OrderStatus,
        trackingId: o.trackingId,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        totalAmount: o.totalAmount,
        transactionId: o.transactionId,
        customerNotes: o.customerNotes,
        adminNotes: o.adminNotes,
        version: o.version ?? 0,
      },
      create: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        addressLine1: o.addressLine1,
        addressLine2: o.addressLine2,
        city: o.city,
        stateCode: o.stateCode,
        postalCode: o.postalCode,
        countryCode: o.countryCode,
        status: o.status as OrderStatus,
        trackingId: o.trackingId,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        totalAmount: o.totalAmount,
        transactionId: o.transactionId,
        customerNotes: o.customerNotes,
        adminNotes: o.adminNotes,
        version: o.version ?? 0,
      },
    });

    // Idempotent seeding: replace this order's items and status history
    // instead of appending, so re-running the seed never duplicates rows.
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });

    for (const item of o.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: skuMap[item.productSku] || null,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        },
      });
    }

    for (const h of o.statusHistory) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: h.status as OrderStatus,
          notes: h.notes,
        },
      });
    }
  }
}

async function main() {
  const { categories, categoryMap } = await seedCategories();
  const skuMap = await seedProducts(categoryMap);
  await seedOrders(skuMap);
  await seedAdmin();

  console.log("Seed completed successfully!");
  console.log(`  - ${categories.length} categories created`);
  console.log(`  - ${SEED_PRODUCTS.length} products created`);
  console.log(`  - ${SEED_ORDERS.length} orders created`);
  console.log(`  - Admin user created (admin / admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
