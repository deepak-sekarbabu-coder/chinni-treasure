import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import * as Excel from "exceljs";

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

function createSheet<T>(
  workbook: Excel.Workbook,
  name: string,
  columns: { header: string; key: keyof T; width: number; format?: (value: unknown) => unknown }[],
) {
  const sheet = workbook.addWorksheet(name, { state: "visible" });
  sheet.addRow(columns.map((c) => c.header));
  sheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
  columns.forEach((c, index) => { sheet.getColumn(index + 1).width = c.width; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
}

function addRows<T>(
  sheet: Excel.Worksheet,
  data: T[],
  columns: { header: string; key: keyof T; width: number; format?: (value: unknown) => unknown }[],
) {
  for (const row of data) {
    sheet.addRow(columns.map((c) => (c.format ? c.format(row[c.key]) : row[c.key])));
  }
}

export async function GET() {
  const admin = await checkAuth();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workbook = new Excel.Workbook();
    workbook.creator = "Chinni Treasure";
    workbook.created = new Date();

    const [categories, products, admins] = await Promise.all([
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.product.findMany({ include: { category: true } }),
      prisma.admin.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    const catColumns = [
      { header: "ID", key: "id" as const, width: 8 },
      { header: "Name", key: "name" as const, width: 25 },
      { header: "Slug", key: "slug" as const, width: 20 },
      { header: "Description", key: "description" as const, width: 40 },
      { header: "Display Order", key: "displayOrder" as const, width: 15 },
      { header: "Is Active", key: "isActive" as const, width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const catSheet = createSheet(workbook, "Categories", catColumns);
    addRows(catSheet, categories, catColumns);

    const prodColumns = [
      { header: "ID", key: "id" as const, width: 36 },
      { header: "SKU", key: "sku" as const, width: 15 },
      { header: "Name", key: "name" as const, width: 40 },
      { header: "Category ID", key: "categoryId" as const, width: 10 },
      { header: "Category Name", key: "category" as const, width: 25, format: (v: unknown) => ((v as { name?: string } | null)?.name ?? "") },
      { header: "Description", key: "description" as const, width: 50 },
      { header: "Price", key: "price" as const, width: 12, format: (v: unknown) => String(v) },
      { header: "Stock Quantity", key: "stockQuantity" as const, width: 18 },
      { header: "Image URL", key: "imageUrl" as const, width: 50 },
      { header: "Badge", key: "badge" as const, width: 15 },
      { header: "Is Active", key: "isActive" as const, width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const prodSheet = createSheet(workbook, "Products", prodColumns);
    addRows(prodSheet, products, prodColumns);

    // ---- Orders (batched) ----
    const orderColumns = [
      { header: "ID", key: "id" as const, width: 36 },
      { header: "Order Number", key: "orderNumber" as const, width: 20 },
      { header: "Customer Name", key: "customerName" as const, width: 30 },
      { header: "Customer Email", key: "customerEmail" as const, width: 35 },
      { header: "Customer Phone", key: "customerPhone" as const, width: 18 },
      { header: "Address Line 1", key: "addressLine1" as const, width: 40 },
      { header: "Address Line 2", key: "addressLine2" as const, width: 40 },
      { header: "City", key: "city" as const, width: 20 },
      { header: "State Code", key: "stateCode" as const, width: 12 },
      { header: "Postal Code", key: "postalCode" as const, width: 12 },
      { header: "Country Code", key: "countryCode" as const, width: 12 },
      { header: "Status", key: "status" as const, width: 15 },
      { header: "Tracking ID", key: "trackingId" as const, width: 20 },
      { header: "Subtotal", key: "subtotal" as const, width: 12, format: (v: unknown) => String(v) },
      { header: "Shipping Cost", key: "shippingCost" as const, width: 15, format: (v: unknown) => String(v) },
      { header: "Total Amount", key: "totalAmount" as const, width: 15, format: (v: unknown) => String(v) },
      { header: "Transaction ID", key: "transactionId" as const, width: 30 },
      { header: "Customer Notes", key: "customerNotes" as const, width: 40 },
      { header: "Admin Notes", key: "adminNotes" as const, width: 40 },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const orderSheet = createSheet(workbook, "Orders", orderColumns);

    let lastOrderId: string | undefined;
    for (;;) {
      const batch = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: BATCH_SIZE,
        ...(lastOrderId ? { skip: 1, cursor: { id: lastOrderId } } : {}),
      });
      if (batch.length === 0) break;
      addRows(orderSheet, batch, orderColumns);
      lastOrderId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    // ---- Order Items (batched) ----
    const itemColumns = [
      { header: "ID", key: "id" as const, width: 36 },
      { header: "Order ID", key: "orderId" as const, width: 36 },
      { header: "Product ID", key: "productId" as const, width: 36 },
      { header: "Product Name", key: "productName" as const, width: 40 },
      { header: "Unit Price", key: "unitPrice" as const, width: 12, format: (v: unknown) => String(v) },
      { header: "Quantity", key: "quantity" as const, width: 10 },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const itemSheet = createSheet(workbook, "Order Items", itemColumns);

    let lastItemId: string | undefined;
    for (;;) {
      const batch = await prisma.orderItem.findMany({
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        ...(lastItemId ? { skip: 1, cursor: { id: lastItemId } } : {}),
      });
      if (batch.length === 0) break;
      addRows(itemSheet, batch, itemColumns);
      lastItemId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    // ---- Status History (batched) ----
    const histColumns = [
      { header: "ID", key: "id" as const, width: 36 },
      { header: "Order ID", key: "orderId" as const, width: 36 },
      { header: "Status", key: "status" as const, width: 15 },
      { header: "Notes", key: "notes" as const, width: 50 },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const histSheet = createSheet(workbook, "Order Status History", histColumns);

    let lastHistId: string | undefined;
    for (;;) {
      const batch = await prisma.orderStatusHistory.findMany({
        orderBy: { createdAt: "asc" },
        take: BATCH_SIZE,
        ...(lastHistId ? { skip: 1, cursor: { id: lastHistId } } : {}),
      });
      if (batch.length === 0) break;
      addRows(histSheet, batch, histColumns);
      lastHistId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    // ---- Admins (small, load fully) ----
    const adminColumns = [
      { header: "ID", key: "id" as const, width: 36 },
      { header: "Username", key: "username" as const, width: 20 },
      { header: "Email", key: "email" as const, width: 35 },
      { header: "Role", key: "role" as const, width: 15 },
      { header: "Is Active", key: "isActive" as const, width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Last Login At", key: "lastLoginAt" as const, width: 20, format: (v: unknown) => (v ? (v as Date).toLocaleString() : "Never") },
      { header: "Created At", key: "createdAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt" as const, width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ];
    const adminSheet = createSheet(workbook, "Admins", adminColumns);
    addRows(adminSheet, admins, adminColumns);

    // ID Lookup sheet
    const lookupSheet = workbook.addWorksheet("ID Lookup");
    lookupSheet.addRow(["Table", "ID", "Name/Identifier"]);
    lookupSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
    for (const cat of categories) lookupSheet.addRow(["Category", cat.id, cat.name]);
    for (const prod of products) lookupSheet.addRow(["Product", prod.id, `${prod.sku || "N/A"} - ${prod.name}`]);
    for (const a of admins) lookupSheet.addRow(["Admin", a.id, `${a.username} (${a.email})`]);
    lookupSheet.getColumn(1).width = 15;
    lookupSheet.getColumn(2).width = 40;
    lookupSheet.getColumn(3).width = 50;

    // Add order numbers to lookup from batches
    lastOrderId = undefined;
    for (;;) {
      const orderBatch: { id: string; orderNumber: string }[] = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true },
        take: BATCH_SIZE,
        ...(lastOrderId ? { skip: 1, cursor: { id: lastOrderId } } : {}),
      });
      if (orderBatch.length === 0) break;
      for (const o of orderBatch) lookupSheet.addRow(["Order", o.id, o.orderNumber]);
      lastOrderId = orderBatch[orderBatch.length - 1].id;
      if (orderBatch.length < BATCH_SIZE) break;
    }

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
