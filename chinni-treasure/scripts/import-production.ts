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

function buildColMap(sheet: ExcelJS.Worksheet): Record<string, number> {
  const idx: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, col) => { idx[String(cell.value).toLowerCase().trim()] = col; });
  return idx;
}

function cell(row: ExcelJS.Row, colMap: Record<string, number>, key: string): unknown {
  const col = colMap[key];
  return col ? row.getCell(col).value : null;
}

async function main() {
  // Auto-discover the latest export file if no path provided
  let filePath = process.argv[2];
  if (!filePath) {
    const { readdirSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const exportsDir = join(process.cwd(), "exports");
    if (existsSync(exportsDir)) {
      const files = readdirSync(exportsDir)
        .filter(f => f.startsWith("chinni-treasure-export-") && f.endsWith(".xlsx"))
        .sort()
        .reverse();
      if (files.length > 0) {
        filePath = join(exportsDir, files[0]);
      }
    }
    if (!filePath) {
      console.error("No export file found. Run 'npm run data:export' first.");
      process.exit(1);
    }
  }
  console.log(`Reading from: ${filePath}`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

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
  const catCol = buildColMap(catSheet);
  const categories: { id: number; name: string; slug: string; description: string | null; displayOrder: number; isActive: boolean }[] = [];
  catSheet.eachRow((row, i) => {
    if (i === 1) return;
    categories.push({
      id: parseNum(cell(row, catCol, "id")),
      name: String(cell(row, catCol, "name") || ""),
      slug: String(cell(row, catCol, "slug") || ""),
      description: cell(row, catCol, "description") ? String(cell(row, catCol, "description")) : null,
      displayOrder: parseNum(cell(row, catCol, "display order")),
      isActive: parseBool(cell(row, catCol, "is active")),
    });
  });
  console.log(`Importing ${categories.length} categories...`);
  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  // --- Products ---
  const prodSheet = wb.getWorksheet("Products")!;
  const prodCol = buildColMap(prodSheet);
  const products: {
    id: string; sku: string | null; name: string; categoryId: number | null;
    description: string | null; price: number; compareAtPrice: number | null; stockQuantity: number;
    imageUrl: string | null; badge: string | null; isActive: boolean;
    visibleHostnames: string | null; deletedAt: Date | null;
    createdAt: Date | null; updatedAt: Date | null;
  }[] = [];
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    products.push({
      id: String(cell(row, prodCol, "id") || ""),
      sku: cell(row, prodCol, "sku") ? String(cell(row, prodCol, "sku")) : null,
      name: String(cell(row, prodCol, "name") || ""),
      categoryId: cell(row, prodCol, "category id") ? parseNum(cell(row, prodCol, "category id")) : null,
      description: cell(row, prodCol, "description") ? String(cell(row, prodCol, "description")) : null,
      price: parseNum(cell(row, prodCol, "price")),
      compareAtPrice: cell(row, prodCol, "compare at price") ? parseNum(cell(row, prodCol, "compare at price")) : null,
      stockQuantity: parseNum(cell(row, prodCol, "stock quantity")),
      imageUrl: cell(row, prodCol, "image url") ? String(cell(row, prodCol, "image url")) : null,
      badge: cell(row, prodCol, "badge") ? String(cell(row, prodCol, "badge")) : null,
      isActive: parseBool(cell(row, prodCol, "is active")),
      visibleHostnames: cell(row, prodCol, "visible hostnames") ? String(cell(row, prodCol, "visible hostnames")) : null,
      deletedAt: parseDate(cell(row, prodCol, "deleted at")),
      createdAt: parseDate(cell(row, prodCol, "created at")),
      updatedAt: parseDate(cell(row, prodCol, "updated at")),
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
        compareAtPrice: p.compareAtPrice,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        badge: p.badge as ProductBadge | null,
        isActive: p.isActive,
        visibleHostnames: p.visibleHostnames,
        deletedAt: p.deletedAt,
        createdAt: p.createdAt ?? undefined,
        updatedAt: p.updatedAt ?? undefined,
      },
    });
  }

  // --- Product Images ---
  const imgSheet = wb.getWorksheet("Product Images");
  const imgCol = imgSheet ? buildColMap(imgSheet) : null;
  const productImages: {
    id: string;
    productId: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
    createdAt: Date | null;
  }[] = [];
  if (imgSheet && imgCol) {
    imgSheet.eachRow((row, i) => {
      if (i === 1) return;
      productImages.push({
        id: String(cell(row, imgCol, "id") || ""),
        productId: String(cell(row, imgCol, "product id") || ""),
        url: String(cell(row, imgCol, "url") || ""),
        isPrimary: parseBool(cell(row, imgCol, "is primary")),
        displayOrder: parseNum(cell(row, imgCol, "display order")),
        createdAt: parseDate(cell(row, imgCol, "created at")),
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
  const orderCol = buildColMap(orderSheet);
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
    version: number;
    createdAt: Date | null;
    updatedAt: Date | null;
  }[] = [];
  orderSheet.eachRow((row, i) => {
    if (i === 1) return;
    orders.push({
      id: String(cell(row, orderCol, "id") || ""),
      orderNumber: String(cell(row, orderCol, "order number") || ""),
      customerName: String(cell(row, orderCol, "customer name") || ""),
      customerEmail: String(cell(row, orderCol, "customer email") || ""),
      customerPhone: String(cell(row, orderCol, "customer phone") || ""),
      addressLine1: String(cell(row, orderCol, "address line 1") || ""),
      addressLine2: cell(row, orderCol, "address line 2") ? String(cell(row, orderCol, "address line 2")) : null,
      city: String(cell(row, orderCol, "city") || ""),
      stateCode: String(cell(row, orderCol, "state code") || ""),
      postalCode: String(cell(row, orderCol, "postal code") || ""),
      countryCode: String(cell(row, orderCol, "country code") || "IN"),
      status: String(cell(row, orderCol, "status") || "pending"),
      trackingId: cell(row, orderCol, "tracking id") ? String(cell(row, orderCol, "tracking id")) : null,
      subtotal: parseNum(cell(row, orderCol, "subtotal")),
      shippingCost: parseNum(cell(row, orderCol, "shipping cost")),
      totalAmount: parseNum(cell(row, orderCol, "total amount")),
      transactionId: cell(row, orderCol, "transaction id") ? String(cell(row, orderCol, "transaction id")) : null,
      customerNotes: cell(row, orderCol, "customer notes") ? String(cell(row, orderCol, "customer notes")) : null,
      adminNotes: cell(row, orderCol, "admin notes") ? String(cell(row, orderCol, "admin notes")) : null,
      version: parseNum(cell(row, orderCol, "version")),
      createdAt: parseDate(cell(row, orderCol, "created at")),
      updatedAt: parseDate(cell(row, orderCol, "updated at")),
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
        version: o.version,
        createdAt: o.createdAt ?? undefined,
        updatedAt: o.updatedAt ?? undefined,
      },
    });
  }

  // --- Order Items ---
  const itemSheet = wb.getWorksheet("Order Items")!;
  const itemCol = buildColMap(itemSheet);
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
      id: String(cell(row, itemCol, "id") || ""),
      orderId: String(cell(row, itemCol, "order id") || ""),
      productId: cell(row, itemCol, "product id") ? String(cell(row, itemCol, "product id")) : null,
      productName: String(cell(row, itemCol, "product name") || ""),
      unitPrice: parseNum(cell(row, itemCol, "unit price")),
      quantity: parseNum(cell(row, itemCol, "quantity")),
      createdAt: parseDate(cell(row, itemCol, "created at")),
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
  const histCol = buildColMap(histSheet);
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
      id: String(cell(row, histCol, "id") || ""),
      orderId: String(cell(row, histCol, "order id") || ""),
      status: String(cell(row, histCol, "status") || ""),
      notes: cell(row, histCol, "notes") ? String(cell(row, histCol, "notes")) : null,
      createdAt: parseDate(cell(row, histCol, "created at")),
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
  const adminCol = buildColMap(adminSheet);
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
      id: String(cell(row, adminCol, "id") || ""),
      username: String(cell(row, adminCol, "username") || ""),
      email: String(cell(row, adminCol, "email") || ""),
      role: String(cell(row, adminCol, "role") || "admin"),
      isActive: parseBool(cell(row, adminCol, "is active")),
      lastLoginAt: parseDate(cell(row, adminCol, "last login at")),
      createdAt: parseDate(cell(row, adminCol, "created at")),
      updatedAt: parseDate(cell(row, adminCol, "updated at")),
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
