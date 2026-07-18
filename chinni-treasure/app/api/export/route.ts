import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import type * as Excel from "exceljs";

const BATCH_SIZE = 1000;

const headerStyle = {
  font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1F4E78" } },
  alignment: { horizontal: "center" as const, vertical: "middle" as const },
  border: {
    top: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
    left: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
    right: { style: "thin" as const, color: { argb: "FFD0D0D0" } },
  },
};

type ColumnDef<T> = { header: string; key: keyof T; width: number; format?: (value: unknown) => unknown };

function createSheet<T>(workbook: Excel.Workbook, name: string, columns: ColumnDef<T>[]) {
  const sheet = workbook.addWorksheet(name, { state: "visible" });
  sheet.addRow(columns.map((c) => c.header));
  sheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
  columns.forEach((c, index) => { sheet.getColumn(index + 1).width = c.width; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
}

function addRows<T>(sheet: Excel.Worksheet, data: T[], columns: ColumnDef<T>[]) {
  for (const row of data) {
    sheet.addRow(columns.map((c) => (c.format ? c.format(row[c.key]) : row[c.key])));
  }
}

async function batchedFetch<T extends { id: string }>(
  findMany: (args: { take: number; skip?: number; cursor?: { id: string } }) => Promise<T[]>,
): Promise<T[]> {
  const results: T[] = [];
  let lastId: string | undefined;
  for (;;) {
    const batch = await findMany({
      take: BATCH_SIZE,
      ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
    });
    if (batch.length === 0) break;
    results.push(...batch);
    lastId = batch[batch.length - 1].id;
    if (batch.length < BATCH_SIZE) break;
  }
  return results;
}

function addBatchedSheet<T extends { id: string }>(
  workbook: Excel.Workbook,
  name: string,
  columns: ColumnDef<T>[],
  findMany: (args: { take: number; skip?: number; cursor?: { id: string } }) => Promise<T[]>,
) {
  const sheet = createSheet(workbook, name, columns);
  let lastId: string | undefined;
  return (async () => {
    for (;;) {
      const batch = await findMany({
        take: BATCH_SIZE,
        ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
      });
      if (batch.length === 0) break;
      addRows(sheet, batch, columns);
      lastId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }
  })();
}

const formatDate = (v: unknown) => (v ? (v as Date).toLocaleString() : "");
const formatBool = (v: unknown) => (v ? "Yes" : "No");
const formatString = (v: unknown) => String(v ?? "");

const catColumns: ColumnDef<{ id: number; name: string; slug: string; description: string | null; displayOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }>[] = [
  { header: "ID", key: "id", width: 8 },
  { header: "Name", key: "name", width: 25 },
  { header: "Slug", key: "slug", width: 20 },
  { header: "Description", key: "description", width: 40 },
  { header: "Display Order", key: "displayOrder", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

type ProductRow = {
  id: string; sku: string | null; name: string; categoryId: number | null;
  category: { name: string } | null; description: string | null; price: unknown;
  stockQuantity: number; imageUrl: string | null; badge: string | null;
  isActive: boolean; createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; isPrimary: boolean; displayOrder: number }[];
};

const prodColumns: ColumnDef<ProductRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "SKU", key: "sku", width: 15 },
  { header: "Name", key: "name", width: 40 },
  { header: "Category ID", key: "categoryId", width: 10 },
  { header: "Category Name", key: "category", width: 25, format: (v) => ((v as { name?: string } | null)?.name ?? "") },
  { header: "Description", key: "description", width: 50 },
  { header: "Price", key: "price", width: 12, format: formatString },
  { header: "Stock Quantity", key: "stockQuantity", width: 18 },
  { header: "Image URL", key: "imageUrl", width: 50 },
  { header: "Badge", key: "badge", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

const imgColumns: ColumnDef<{ id: string; productId: string; url: string; isPrimary: boolean; displayOrder: number; createdAt: Date }>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Product ID", key: "productId", width: 36 },
  { header: "URL", key: "url", width: 60 },
  { header: "Is Primary", key: "isPrimary", width: 12, format: formatBool },
  { header: "Display Order", key: "displayOrder", width: 15 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const orderColumns: ColumnDef<{ id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string; addressLine1: string; addressLine2: string | null; city: string; stateCode: string; postalCode: string; countryCode: string; status: string; trackingId: string | null; subtotal: unknown; shippingCost: unknown; totalAmount: unknown; transactionId: string | null; customerNotes: string | null; adminNotes: string | null; createdAt: Date; updatedAt: Date }>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Order Number", key: "orderNumber", width: 20 },
  { header: "Customer Name", key: "customerName", width: 30 },
  { header: "Customer Email", key: "customerEmail", width: 35 },
  { header: "Customer Phone", key: "customerPhone", width: 18 },
  { header: "Address Line 1", key: "addressLine1", width: 40 },
  { header: "Address Line 2", key: "addressLine2", width: 40 },
  { header: "City", key: "city", width: 20 },
  { header: "State Code", key: "stateCode", width: 12 },
  { header: "Postal Code", key: "postalCode", width: 12 },
  { header: "Country Code", key: "countryCode", width: 12 },
  { header: "Status", key: "status", width: 15 },
  { header: "Tracking ID", key: "trackingId", width: 20 },
  { header: "Subtotal", key: "subtotal", width: 12, format: formatString },
  { header: "Shipping Cost", key: "shippingCost", width: 15, format: formatString },
  { header: "Total Amount", key: "totalAmount", width: 15, format: formatString },
  { header: "Transaction ID", key: "transactionId", width: 30 },
  { header: "Customer Notes", key: "customerNotes", width: 40 },
  { header: "Admin Notes", key: "adminNotes", width: 40 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

const itemColumns: ColumnDef<{ id: string; orderId: string; productId: string | null; productName: string; unitPrice: unknown; quantity: number; createdAt: Date }>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Order ID", key: "orderId", width: 36 },
  { header: "Product ID", key: "productId", width: 36 },
  { header: "Product Name", key: "productName", width: 40 },
  { header: "Unit Price", key: "unitPrice", width: 12, format: formatString },
  { header: "Quantity", key: "quantity", width: 10 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const histColumns: ColumnDef<{ id: string; orderId: string; status: string; notes: string | null; createdAt: Date }>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Order ID", key: "orderId", width: 36 },
  { header: "Status", key: "status", width: 15 },
  { header: "Notes", key: "notes", width: 50 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const adminColumns: ColumnDef<{ id: string; username: string; email: string; role: string; isActive: boolean; lastLoginAt: Date | null; createdAt: Date; updatedAt: Date }>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Username", key: "username", width: 20 },
  { header: "Email", key: "email", width: 35 },
  { header: "Role", key: "role", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Last Login At", key: "lastLoginAt", width: 20, format: (v) => (v ? formatDate(v) : "Never") },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ExcelMod = await import("exceljs");
    const workbook = new ExcelMod.Workbook();
    workbook.creator = "Chinni Treasure";
    workbook.created = new Date();

    const [categories, products, productImages, admins] = await Promise.all([
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.product.findMany({ include: { category: true, images: { orderBy: { displayOrder: "asc" } } } }),
      batchedFetch((args) =>
        prisma.productImage.findMany({ orderBy: { createdAt: "asc" }, ...args })),
      prisma.admin.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const catSheet = createSheet(workbook, "Categories", catColumns);
    addRows(catSheet, categories, catColumns);

    const prodSheet = createSheet(workbook, "Products", prodColumns);
    addRows(prodSheet, products, prodColumns);

    const imgSheet = createSheet(workbook, "Product Images", imgColumns);
    addRows(imgSheet, productImages, imgColumns);

    await Promise.all([
      addBatchedSheet(workbook, "Orders", orderColumns, (args) =>
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, ...args })),
      addBatchedSheet(workbook, "Order Items", itemColumns, (args) =>
        prisma.orderItem.findMany({ orderBy: { createdAt: "asc" }, ...args })),
      addBatchedSheet(workbook, "Order Status History", histColumns, (args) =>
        prisma.orderStatusHistory.findMany({ orderBy: { createdAt: "asc" }, ...args })),
    ]);

    const adminSheet = createSheet(workbook, "Admins", adminColumns);
    addRows(adminSheet, admins, adminColumns);

    const lookupSheet = workbook.addWorksheet("ID Lookup");
    lookupSheet.addRow(["Table", "ID", "Name/Identifier"]);
    lookupSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
    for (const cat of categories) lookupSheet.addRow(["Category", cat.id, cat.name]);
    for (const prod of products) lookupSheet.addRow(["Product", prod.id, `${prod.sku || "N/A"} - ${prod.name}`]);
    for (const a of admins) lookupSheet.addRow(["Admin", a.id, `${a.username} (${a.email})`]);
    lookupSheet.getColumn(1).width = 15;
    lookupSheet.getColumn(2).width = 40;
    lookupSheet.getColumn(3).width = 50;

    const orders = await batchedFetch(
      (args) => prisma.order.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true }, ...args }),
    );
    for (const o of orders) lookupSheet.addRow(["Order", o.id, o.orderNumber]);

    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `chinni-treasure-export-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
