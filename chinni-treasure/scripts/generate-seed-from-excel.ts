import ExcelJS from "exceljs";

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
  const catSheet = wb.getWorksheet("Categories")!;
  const categories: {
    name: string;
    slug: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
  }[] = [];
  catSheet.eachRow((row, i) => {
    if (i === 1) return;
    categories.push({
      name: String(row.getCell(2).value || ""),
      slug: String(row.getCell(3).value || ""),
      description: row.getCell(4).value
        ? String(row.getCell(4).value)
        : null,
      displayOrder: parseNum(row.getCell(5).value),
      isActive: parseBool(row.getCell(6).value),
    });
  });

  // --- Products ---
  const prodSheet = wb.getWorksheet("Products")!;
  type ProductColMap = { sku: number; name: number; price: number; compareAtPrice: number | null; stockQuantity: number; imageUrl: number; description: number; badge: number };
  function buildProductColMap(): ProductColMap {
    const header = prodSheet.getRow(1);
    const idx: Record<string, number> = {};
    header.eachCell((cell, col) => { idx[String(cell.value).toLowerCase().trim()] = col; });
    return {
      sku: idx["sku"] || 2,
      name: idx["name"] || 3,
      description: idx["description"] || 6,
      price: idx["price"] || 7,
      compareAtPrice: idx["compare at price"] || null,
      stockQuantity: idx["stock quantity"] || (idx["image url"] ? idx["image url"] - 1 : 8),
      imageUrl: idx["image url"] || (idx["badge"] ? idx["badge"] - 1 : 9),
      badge: idx["badge"] || 10,
    };
  }
  const prodCol = buildProductColMap();
  const products: {
    sku: string;
    name: string;
    categorySlug: string;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    imageUrl: string | null;
    description: string | null;
    badge: string | null;
  }[] = [];
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    const comparePrice = prodCol.compareAtPrice ? row.getCell(prodCol.compareAtPrice).value : null;
    products.push({
      sku: String(row.getCell(prodCol.sku).value || ""),
      name: String(row.getCell(prodCol.name).value || ""),
      categorySlug: "",
      price: parseNum(row.getCell(prodCol.price).value),
      compareAtPrice: comparePrice ? parseNum(comparePrice) : null,
      stockQuantity: parseNum(row.getCell(prodCol.stockQuantity).value),
      imageUrl: extractUrl(row.getCell(prodCol.imageUrl).value),
      description: row.getCell(prodCol.description).value ? String(row.getCell(prodCol.description).value) : null,
      badge: row.getCell(prodCol.badge).value ? String(row.getCell(prodCol.badge).value) : null,
    });
  });

  // Build category ID to slug mapping
  const catIdToSlug: Record<number, string> = {};
  catSheet.eachRow((row, i) => {
    if (i === 1) return;
    const id = parseNum(row.getCell(1).value);
    const slug = String(row.getCell(3).value || "");
    catIdToSlug[id] = slug;
  });

  // Map category slugs to products
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    const catId = row.getCell(4).value ? parseNum(row.getCell(4).value) : null;
    products[i - 2].categorySlug = catId && catIdToSlug[catId]
      ? catIdToSlug[catId]
      : "";
  });

  // Build product ID to additional images mapping from Product Images sheet
  const productImagesByProductId: Record<string, string[]> = {};
  const imgSheet = wb.getWorksheet("Product Images");
  if (imgSheet) {
    const imgRows: { productId: string; url: string; isPrimary: boolean; displayOrder: number }[] = [];
    imgSheet.eachRow((row, i) => {
      if (i === 1) return;
      const url = extractUrl(row.getCell(3).value);
      if (url) {
        imgRows.push({
          productId: String(row.getCell(2).value || ""),
          url,
          isPrimary: parseBool(row.getCell(4).value),
          displayOrder: parseNum(row.getCell(5).value),
        });
      }
    });
    imgRows.sort((a, b) => a.displayOrder - b.displayOrder);
    for (const img of imgRows) {
      if (!productImagesByProductId[img.productId]) {
        productImagesByProductId[img.productId] = [];
      }
      productImagesByProductId[img.productId].push(img.url);
    }
  }

  // Build product SKU to images and product name to SKU mappings
  const prodIdToSku: Record<string, string> = {};
  const prodSkuToImages: Record<string, string[]> = {};
  const prodNameToSku: Record<string, string> = {};
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    const id = String(row.getCell(1).value || "");
    const sku = String(row.getCell(2).value || "");
    const name = String(row.getCell(3).value || "").toLowerCase().trim();
    prodIdToSku[id] = sku;
    if (productImagesByProductId[id]) {
      prodSkuToImages[sku] = productImagesByProductId[id];
    }
    prodNameToSku[name] = sku;
  });

  // --- Orders ---
  const orderSheet = wb.getWorksheet("Orders");
  const orders: {
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
    createdAt: string | null;
    updatedAt: string | null;
  }[] = [];
  if (orderSheet) {
    orderSheet.eachRow((row, i) => {
      if (i === 1) return;
      orders.push({
        orderNumber: String(row.getCell(2).value || ""),
        customerName: String(row.getCell(3).value || ""),
        customerEmail: String(row.getCell(4).value || ""),
        customerPhone: String(row.getCell(5).value || ""),
        addressLine1: String(row.getCell(6).value || ""),
        addressLine2: row.getCell(7).value ? String(row.getCell(7).value) : null,
        city: String(row.getCell(8).value || ""),
        stateCode: String(row.getCell(9).value || ""),
        postalCode: String(row.getCell(10).value || ""),
        countryCode: String(row.getCell(11).value || "IN"),
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
  }

  // --- Order Items ---
  const oiSheet = wb.getWorksheet("Order Items");
  const orderItems: {
    orderNumber: string;
    productSku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    createdAt: string | null;
  }[] = [];
  if (oiSheet) {
    let orderIdx = 0;
    oiSheet.eachRow((row, i) => {
      if (i === 1) return;
      const prodId = String(row.getCell(4).value || "");
      const prodName = String(row.getCell(5).value || "");
      let sku = prodIdToSku[prodId] || "";
      // Fallback: try matching by product name
      if (!sku) {
        sku = prodNameToSku[prodName.toLowerCase().trim()] || "";
      }
      orderItems.push({
        orderNumber: orders[orderIdx]?.orderNumber || "",
        productSku: sku,
        productName: prodName,
        unitPrice: parseNum(row.getCell(6).value),
        quantity: parseNum(row.getCell(7).value),
        createdAt: parseDate(row.getCell(8).value),
      });
      orderIdx++;
    });
  }

  // --- Order Status History ---
  const oshSheet = wb.getWorksheet("Order Status History");
  const orderStatusHistory: {
    orderNumber: string;
    status: string;
    notes: string | null;
    createdAt: string | null;
  }[] = [];
  if (oshSheet) {
    // Build order ID to order number mapping from Orders sheet
    const orderIdToNumber: Record<string, string> = {};
    orderSheet?.eachRow((row, i) => {
      if (i === 1) return;
      orderIdToNumber[String(row.getCell(1).value || "")] = String(row.getCell(2).value || "");
    });

    oshSheet.eachRow((row, i) => {
      if (i === 1) return;
      const orderId = String(row.getCell(2).value || "");
      orderStatusHistory.push({
        orderNumber: orderIdToNumber[orderId] || "",
        status: String(row.getCell(4).value || ""),
        notes: row.getCell(5).value ? String(row.getCell(5).value) : null,
        createdAt: parseDate(row.getCell(6).value),
      });
    });
  }

  // --- Admins ---
  const adminSheet = wb.getWorksheet("Admins");
  const admins: {
    username: string;
    email: string;
    role: string;
    isActive: boolean;
  }[] = [];
  if (adminSheet) {
    adminSheet.eachRow((row, i) => {
      if (i === 1) return;
      admins.push({
        username: String(row.getCell(2).value || ""),
        email: String(row.getCell(3).value || ""),
        role: String(row.getCell(4).value || "admin"),
        isActive: parseBool(row.getCell(5).value),
      });
    });
  }

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
  imageUrl: string;
  additionalImages: string[];
  description: string;
  badge: ProductBadge | null;
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
