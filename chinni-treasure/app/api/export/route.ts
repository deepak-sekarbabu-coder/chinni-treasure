import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { checkAuth } from "@/src/lib/auth";
import * as Excel from "exceljs";

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

function addSheet<T>(
  workbook: Excel.Workbook,
  name: string,
  data: T[],
  columns: { header: string; key: keyof T; width: number; format?: (value: unknown) => unknown }[],
) {
  const sheet = workbook.addWorksheet(name, { state: "visible" });
  sheet.addRow(columns.map((c) => c.header));
  sheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
  for (const row of data) {
    sheet.addRow(columns.map((c) => (c.format ? c.format(row[c.key]) : row[c.key])));
  }
  columns.forEach((c, index) => { sheet.getColumn(index + 1).width = c.width; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
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

    const [categories, products, orders, orderItems, statusHistory, admins] = await Promise.all([
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.product.findMany({ include: { category: true } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.orderItem.findMany({ include: { order: true, product: true } }),
      prisma.orderStatusHistory.findMany({ include: { order: true }, orderBy: { createdAt: "asc" } }),
      prisma.admin.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    addSheet(workbook, "Categories", categories, [
      { header: "ID", key: "id", width: 8 },
      { header: "Name", key: "name", width: 25 },
      { header: "Slug", key: "slug", width: 20 },
      { header: "Description", key: "description", width: 40 },
      { header: "Display Order", key: "displayOrder", width: 15 },
      { header: "Is Active", key: "isActive", width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    addSheet(workbook, "Products", products, [
      { header: "ID", key: "id", width: 36 },
      { header: "SKU", key: "sku", width: 15 },
      { header: "Name", key: "name", width: 40 },
      { header: "Category ID", key: "categoryId", width: 10 },
      { header: "Category Name", key: "category", width: 25, format: (v: unknown) => ((v as { name?: string } | null)?.name ?? "") },
      { header: "Description", key: "description", width: 50 },
      { header: "Price", key: "price", width: 12, format: (v: unknown) => String(v) },
      { header: "Stock Quantity", key: "stockQuantity", width: 18 },
      { header: "Image URL", key: "imageUrl", width: 50 },
      { header: "Badge", key: "badge", width: 15 },
      { header: "Is Active", key: "isActive", width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    addSheet(workbook, "Orders", orders, [
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
      { header: "Subtotal", key: "subtotal", width: 12, format: (v: unknown) => String(v) },
      { header: "Shipping Cost", key: "shippingCost", width: 15, format: (v: unknown) => String(v) },
      { header: "Total Amount", key: "totalAmount", width: 15, format: (v: unknown) => String(v) },
      { header: "Transaction ID", key: "transactionId", width: 30 },
      { header: "Customer Notes", key: "customerNotes", width: 40 },
      { header: "Admin Notes", key: "adminNotes", width: 40 },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    addSheet(workbook, "Order Items", orderItems, [
      { header: "ID", key: "id", width: 36 },
      { header: "Order ID", key: "orderId", width: 36 },
      { header: "Order Number", key: "order", width: 20, format: (v: unknown) => ((v as { orderNumber?: string } | null)?.orderNumber ?? "") },
      { header: "Product ID", key: "productId", width: 36 },
      { header: "Product Name", key: "productName", width: 40 },
      { header: "Unit Price", key: "unitPrice", width: 12, format: (v: unknown) => String(v) },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    addSheet(workbook, "Order Status History", statusHistory, [
      { header: "ID", key: "id", width: 36 },
      { header: "Order ID", key: "orderId", width: 36 },
      { header: "Order Number", key: "order", width: 20, format: (v: unknown) => ((v as { orderNumber?: string } | null)?.orderNumber ?? "") },
      { header: "Status", key: "status", width: 15 },
      { header: "Notes", key: "notes", width: 50 },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    addSheet(workbook, "Admins", admins, [
      { header: "ID", key: "id", width: 36 },
      { header: "Username", key: "username", width: 20 },
      { header: "Email", key: "email", width: 35 },
      { header: "Role", key: "role", width: 15 },
      { header: "Is Active", key: "isActive", width: 12, format: (v: unknown) => (v ? "Yes" : "No") },
      { header: "Last Login At", key: "lastLoginAt", width: 20, format: (v: unknown) => (v ? (v as Date).toLocaleString() : "Never") },
      { header: "Created At", key: "createdAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
      { header: "Updated At", key: "updatedAt", width: 20, format: (v: unknown) => (v as Date).toLocaleString() },
    ]);

    // ID Lookup sheet
    const lookupSheet = workbook.addWorksheet("ID Lookup");
    lookupSheet.addRow(["Table", "ID", "Name/Identifier"]);
    lookupSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
    for (const cat of categories) lookupSheet.addRow(["Category", cat.id, cat.name]);
    for (const prod of products) lookupSheet.addRow(["Product", prod.id, `${prod.sku || "N/A"} - ${prod.name}`]);
    for (const order of orders) lookupSheet.addRow(["Order", order.id, order.orderNumber]);
    for (const a of admins) lookupSheet.addRow(["Admin", a.id, `${a.username} (${a.email})`]);
    lookupSheet.getColumn(1).width = 15;
    lookupSheet.getColumn(2).width = 40;
    lookupSheet.getColumn(3).width = 50;

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
