// fallow-ignore-file unused-file
import "dotenv/config";
import { PrismaClient, type OrderStatus, type AdminRole, type ProductBadge } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ExcelJS from "exceljs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "yes" || val.toLowerCase() === "true";
  return false;
}

function parseNum(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

async function main() {
  console.log("Reading Excel file...");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("chinni-treasure-export-2026-07-18.xlsx");

  // Clear all tables in FK-safe order
  console.log("Clearing existing data...");
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();

  // --- Categories ---
  const catSheet = wb.getWorksheet("Categories")!;
  const categories: { id: number; name: string; slug: string; description: string | null; displayOrder: number; isActive: boolean }[] = [];
  catSheet.eachRow((row, i) => {
    if (i === 1) return;
    categories.push({
      id: parseNum(row.getCell(1).value),
      name: String(row.getCell(2).value || ""),
      slug: String(row.getCell(3).value || ""),
      description: row.getCell(4).value ? String(row.getCell(4).value) : null,
      displayOrder: parseNum(row.getCell(5).value),
      isActive: parseBool(row.getCell(6).value),
    });
  });
  console.log(`Importing ${categories.length} categories...`);
  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  // --- Products ---
  const prodSheet = wb.getWorksheet("Products")!;
  const products: {
    id: string; sku: string | null; name: string; categoryId: number | null;
    description: string | null; price: number; stockQuantity: number;
    imageUrl: string | null; badge: string | null; isActive: boolean;
    createdAt: Date | null; updatedAt: Date | null;
  }[] = [];
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    products.push({
      id: String(row.getCell(1).value || ""),
      sku: row.getCell(2).value ? String(row.getCell(2).value) : null,
      name: String(row.getCell(3).value || ""),
      categoryId: row.getCell(4).value ? parseNum(row.getCell(4).value) : null,
      description: row.getCell(6).value ? String(row.getCell(6).value) : null,
      price: parseNum(row.getCell(7).value),
      stockQuantity: parseNum(row.getCell(8).value),
      imageUrl: row.getCell(9).value ? String(row.getCell(9).value) : null,
      badge: row.getCell(10).value ? String(row.getCell(10).value) : null,
      isActive: parseBool(row.getCell(11).value),
      createdAt: parseDate(row.getCell(12).value),
      updatedAt: parseDate(row.getCell(13).value),
    });
  });
  console.log(`Importing ${products.length} products...`);
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryId: p.categoryId,
        description: p.description,
        price: p.price,
        compareAtPrice: null,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        badge: p.badge as ProductBadge | null,
        isActive: p.isActive,
        createdAt: p.createdAt ?? undefined,
        updatedAt: p.updatedAt ?? undefined,
      },
    });
  }

  // --- Product Images ---
  const imgSheet = wb.getWorksheet("Product Images");
  const productImages: {
    id: string;
    productId: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
    createdAt: Date | null;
  }[] = [];
  if (imgSheet) {
    imgSheet.eachRow((row, i) => {
      if (i === 1) return;
      productImages.push({
        id: String(row.getCell(1).value || ""),
        productId: String(row.getCell(2).value || ""),
        url: String(row.getCell(3).value || ""),
        isPrimary: parseBool(row.getCell(4).value),
        displayOrder: parseNum(row.getCell(5).value),
        createdAt: parseDate(row.getCell(6).value),
      });
    });
  }
  console.log(`Importing ${productImages.length} product images...`);
  for (const img of productImages) {
    await prisma.productImage.create({
      data: {
        id: img.id,
        productId: img.productId,
        url: img.url,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
        createdAt: img.createdAt ?? undefined,
      },
    });
  }

  // --- Orders ---
  const orderSheet = wb.getWorksheet("Orders")!;
  const orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateCode: string;
    postalCode: string;
    countryCode: string;
    status: string;
    trackingId: string | null;
    subtotal: number;
    shippingCost: number;
    totalAmount: number;
    transactionId: string | null;
    customerNotes: string | null;
    adminNotes: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }[] = [];
  orderSheet.eachRow((row, i) => {
    if (i === 1) return;
    orders.push({
      id: String(row.getCell(1).value || ""),
      orderNumber: String(row.getCell(2).value || ""),
      customerName: String(row.getCell(3).value || ""),
      customerEmail: String(row.getCell(4).value || ""),
      customerPhone: String(row.getCell(5).value || ""),
      addressLine1: String(row.getCell(6).value || ""),
      addressLine2: row.getCell(7).value ? String(row.getCell(7).value) : null,
      city: String(row.getCell(8).value || ""),
      stateCode: String(row.getCell(9).value || ""),
      postalCode: String(row.getCell(10).value || ""),
      countryCode: row.getCell(11).value ? String(row.getCell(11).value) : "IN",
      status: String(row.getCell(12).value || "pending"),
      trackingId: row.getCell(13).value ? String(row.getCell(13).value) : null,
      subtotal: parseNum(row.getCell(14).value),
      shippingCost: parseNum(row.getCell(15).value),
      totalAmount: parseNum(row.getCell(16).value),
      transactionId: row.getCell(17).value ? String(row.getCell(17).value) : null,
      customerNotes: row.getCell(18).value ? String(row.getCell(18).value) : null,
      adminNotes: row.getCell(19).value ? String(row.getCell(19).value) : null,
      createdAt: parseDate(row.getCell(20).value),
      updatedAt: parseDate(row.getCell(21).value),
    });
  });
  console.log(`Importing ${orders.length} orders...`);
  for (const o of orders) {
    await prisma.order.create({
      data: {
        id: o.id,
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
        createdAt: o.createdAt ?? undefined,
        updatedAt: o.updatedAt ?? undefined,
      },
    });
  }

  // --- Order Items ---
  const itemSheet = wb.getWorksheet("Order Items")!;
  const items: {
    id: string;
    orderId: string;
    productId: string | null;
    productName: string;
    unitPrice: number;
    quantity: number;
    createdAt: Date | null;
  }[] = [];
  itemSheet.eachRow((row, i) => {
    if (i === 1) return;
    items.push({
      id: String(row.getCell(1).value || ""),
      orderId: String(row.getCell(2).value || ""),
      productId: row.getCell(3).value ? String(row.getCell(3).value) : null,
      productName: String(row.getCell(4).value || ""),
      unitPrice: parseNum(row.getCell(5).value),
      quantity: parseNum(row.getCell(6).value),
      createdAt: parseDate(row.getCell(7).value),
    });
  });
  console.log(`Importing ${items.length} order items...`);
  for (const it of items) {
    await prisma.orderItem.create({
      data: {
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        productName: it.productName,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        createdAt: it.createdAt ?? undefined,
      },
    });
  }

  // --- Order Status History ---
  const histSheet = wb.getWorksheet("Order Status History")!;
  const history: {
    id: string;
    orderId: string;
    status: string;
    notes: string | null;
    createdAt: Date | null;
  }[] = [];
  histSheet.eachRow((row, i) => {
    if (i === 1) return;
    history.push({
      id: String(row.getCell(1).value || ""),
      orderId: String(row.getCell(2).value || ""),
      status: String(row.getCell(3).value || ""),
      notes: row.getCell(4).value ? String(row.getCell(4).value) : null,
      createdAt: parseDate(row.getCell(5).value),
    });
  });
  console.log(`Importing ${history.length} status history records...`);
  for (const h of history) {
    await prisma.orderStatusHistory.create({
      data: {
        id: h.id,
        orderId: h.orderId,
        status: h.status as OrderStatus,
        notes: h.notes,
        createdAt: h.createdAt ?? undefined,
      },
    });
  }

  // --- Admins ---
  const adminSheet = wb.getWorksheet("Admins")!;
  const admins: {
    id: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }[] = [];
  adminSheet.eachRow((row, i) => {
    if (i === 1) return;
    admins.push({
      id: String(row.getCell(1).value || ""),
      username: String(row.getCell(2).value || ""),
      email: String(row.getCell(3).value || ""),
      role: String(row.getCell(4).value || "admin"),
      isActive: parseBool(row.getCell(5).value),
      lastLoginAt: parseDate(row.getCell(6).value),
      createdAt: parseDate(row.getCell(7).value),
      updatedAt: parseDate(row.getCell(8).value),
    });
  });
  console.log(`Importing ${admins.length} admins...`);
  for (const a of admins) {
    await prisma.admin.create({
      data: {
        id: a.id,
        username: a.username,
        email: a.email,
        passwordHash: "IMPORTED_SEE_PRODUCTION",
        role: a.role as AdminRole,
        isActive: a.isActive,
        lastLoginAt: a.lastLoginAt,
        createdAt: a.createdAt ?? undefined,
        updatedAt: a.updatedAt ?? undefined,
      },
    });
  }

  console.log("Import complete!");
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Product Images: ${productImages.length}`);
  console.log(`  Orders: ${orders.length}`);
  console.log(`  Order Items: ${items.length}`);
  console.log(`  Status History: ${history.length}`);
  console.log(`  Admins: ${admins.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
