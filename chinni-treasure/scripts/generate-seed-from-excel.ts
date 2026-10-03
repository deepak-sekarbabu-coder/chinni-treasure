import ExcelJS from "exceljs";
import { sheetRows } from "@/src/lib/sheet-rows";

function parseNum(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string")
    return val.toLowerCase() === "yes" || val.toLowerCase() === "true";
  return false;
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function extractUrl(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val.trim() || null;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    const url = (obj.hyperlink || obj.text || "").toString().trim();
    return url || null;
  }
  return null;
}

const str = (v: unknown, fallback = ""): string => String(v ?? fallback);
const strOrNull = (v: unknown): string | null => (v ? String(v) : null);

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

  // --- Categories ---
  const categories = sheetRows(wb, "Categories").map((r) => ({
    name: str(r.name),
    slug: str(r.slug),
    description: strOrNull(r.description),
    displayOrder: parseNum(r["display order"]),
    isActive: parseBool(r["is active"]),
  }));

  // --- Products ---
  const productRows = sheetRows(wb, "Products");
  const products = productRows.map((r) => ({
    sku: str(r.sku),
    name: str(r.name),
    categorySlug: "",
    price: parseNum(r.price),
    compareAtPrice: r["compare at price"] ? parseNum(r["compare at price"]) : null,
    stockQuantity: parseNum(r["stock quantity"]),
    imageUrl: extractUrl(r["image url"]),
    description: strOrNull(r.description),
    badge: strOrNull(r.badge),
    // Absent column means an older export: fall back to the schema default
    // rather than reading the wrong cell.
    isActive: r["is active"] === undefined ? true : parseBool(r["is active"]),
    allowGiftBoxBundling: parseBool(r["allow gift box bundling"]),
    visibleHostnames: strOrNull(r["visible hostnames"]),
    deletedAt: parseDate(r["deleted at"]),
  }));

  // Build category ID to slug mapping, then map category slugs to products
  const catIdToSlug: Record<number, string> = {};
  for (const row of sheetRows(wb, "Categories")) {
    catIdToSlug[parseNum(row.id)] = str(row.slug);
  }
  productRows.forEach((row, i) => {
    const catId = row["category id"] ? parseNum(row["category id"]) : null;
    products[i].categorySlug = (catId && catIdToSlug[catId]) || "";
  });

  // Build product ID to additional images mapping from Product Images sheet
  const productImagesByProductId: Record<string, string[]> = {};
  const imgRows = sheetRows(wb, "Product Images")
    .map((r) => ({
      productId: str(r["product id"]),
      url: extractUrl(r.url),
      isPrimary: parseBool(r["is primary"]),
      displayOrder: parseNum(r["display order"]),
    }))
    .filter((img): img is { productId: string; url: string; isPrimary: boolean; displayOrder: number } =>
      Boolean(img.url));
  imgRows.sort((a, b) => a.displayOrder - b.displayOrder);
  for (const img of imgRows) {
    (productImagesByProductId[img.productId] ??= []).push(img.url);
  }

  // Build product SKU to images and product name to SKU mappings
  const prodIdToSku: Record<string, string> = {};
  const prodSkuToImages: Record<string, string[]> = {};
  const prodNameToSku: Record<string, string> = {};
  for (const row of productRows) {
    const id = str(row.id);
    const sku = str(row.sku);
    prodIdToSku[id] = sku;
    if (productImagesByProductId[id]) {
      prodSkuToImages[sku] = productImagesByProductId[id];
    }
    prodNameToSku[str(row.name).toLowerCase().trim()] = sku;
  }

  // --- Orders ---
  const orderRows = sheetRows(wb, "Orders");
  const orders = orderRows.map((cell) => ({
      orderNumber: str(cell["order number"]),
      customerName: str(cell["customer name"]),
      customerEmail: str(cell["customer email"]),
      customerPhone: str(cell["customer phone"]),
      addressLine1: str(cell["address line 1"]),
      addressLine2: strOrNull(cell["address line 2"]),
      city: str(cell.city),
      stateCode: str(cell["state code"]),
      postalCode: str(cell["postal code"]),
      countryCode: str(cell["country code"], "IN"),
      status: str(cell.status, "pending"),
      trackingId: strOrNull(cell["tracking id"]),
      subtotal: parseNum(cell.subtotal),
      shippingCost: parseNum(cell["shipping cost"]),
      totalAmount: parseNum(cell["total amount"]),
      transactionId: strOrNull(cell["transaction id"]),
      customerNotes: strOrNull(cell["customer notes"]),
      adminNotes: strOrNull(cell["admin notes"]),
      version: parseNum(cell.version),
      createdAt: parseDate(cell["created at"]),
      updatedAt: parseDate(cell["updated at"]),
    }));

  // Order id -> order number, read once and shared by items and status history
  const orderIdToNumber: Record<string, string> = {};
  for (const row of orderRows) {
    orderIdToNumber[str(row.id)] = str(row["order number"]);
  }

  // --- Order Items ---
  const itemIdToSku: Record<string, string> = {};
  const orderItems: {
    orderNumber: string;
    productSku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    parentProductSku: string | null;
    createdAt: string | null;
  }[] = [];
  for (const cell of sheetRows(wb, "Order Items")) {
    const id = str(cell.id);
    const productName = str(cell["product name"]);
    // Prefer the product id; fall back to a name match when the product row
    // is gone from the export.
    const productSku = prodIdToSku[str(cell["product id"])]
      || prodNameToSku[productName.toLowerCase().trim()]
      || "";
    if (id && productSku) {
      itemIdToSku[id] = productSku;
    }
    const parentItemId = strOrNull(cell["parent order item id"]);
    orderItems.push({
      orderNumber: orderIdToNumber[str(cell["order id"])] || "",
      productSku,
      productName,
      unitPrice: parseNum(cell["unit price"]),
      quantity: parseNum(cell.quantity),
      parentProductSku: parentItemId ? itemIdToSku[parentItemId] ?? null : null,
      createdAt: parseDate(cell["created at"]),
    });
  }

  // --- Order Status History ---
  const orderStatusHistory = sheetRows(wb, "Order Status History").map((cell) => ({
    orderNumber: orderIdToNumber[str(cell["order id"])] || "",
    status: str(cell.status),
    notes: strOrNull(cell.notes),
    createdAt: parseDate(cell["created at"]),
  }));

  // --- Admins ---
  const admins = sheetRows(wb, "Admins").map((cell) => ({
    username: str(cell.username),
    email: str(cell.email),
    role: str(cell.role, "admin"),
    isActive: parseBool(cell["is active"]),
  }));

  // Output as TypeScript
  const seedOrdersJson = JSON.stringify(
    orders.map((o) => ({
      ...o,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- orderNumber excluded from rest
      items: orderItems.filter((i) => i.orderNumber === o.orderNumber).map(({ orderNumber, ...rest }) => rest),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- orderNumber excluded from rest
      statusHistory: orderStatusHistory.filter((h) => h.orderNumber === o.orderNumber).map(({ orderNumber, ...rest }) => rest),
    })),
    null,
    2,
  );

  const output = `import type { ProductBadge } from "@prisma/client";

export const SEED_CATEGORIES = ${JSON.stringify(categories, null, 2)};

export interface SeedProduct {
  sku: string;
  name: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  additionalImages: string[];
  description: string | null;
  badge: ProductBadge | null;
  isActive: boolean;
  allowGiftBoxBundling?: boolean;
  visibleHostnames: string | null;
  deletedAt: string | null;
}

export const SEED_PRODUCTS: SeedProduct[] = ${JSON.stringify(
    products.map((p) => ({
      ...p,
      additionalImages: prodSkuToImages[p.sku] || (p.imageUrl ? [p.imageUrl] : []),
    })),
    null,
    2,
  )};

export interface SeedOrderItem {
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  parentProductSku?: string | null;
  createdAt: string | null;
}

export interface SeedOrder {
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
  createdAt: string | null;
  updatedAt: string | null;
  items: SeedOrderItem[];
  statusHistory: { status: string; notes: string | null; createdAt: string | null }[];
}

export const SEED_ORDERS: SeedOrder[] = ${seedOrdersJson};
`;

  const fs = await import("fs");
  fs.writeFileSync("prisma/seed-data.ts", output);
  console.log("Generated prisma/seed-data.ts");
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Orders: ${orders.length}`);
  console.log(`  Order Items: ${orderItems.length}`);
  console.log(`  Order Status History: ${orderStatusHistory.length}`);
  console.log(`  Admins: ${admins.length}`);
}

main().catch(console.error);
