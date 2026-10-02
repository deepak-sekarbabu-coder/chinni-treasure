import type { ExportData } from "@/src/lib/export-read";
import * as Excel from "exceljs";

/**
 * Row shapes come from the Prisma payloads the export read surface returns,
 * so a schema change breaks the typecheck here instead of silently dropping a
 * column. The hand-written `*Row` copies these replaced were a second home for
 * the schema.
 */
export type CategoryRow = ExportData["categories"][number];
export type ProductRow = ExportData["products"][number];
export type ProductImageRow = ExportData["productImages"][number];
export type OrderRow = ExportData["orders"][number];
export type OrderItemRow = ExportData["orderItems"][number];
export type StatusHistoryRow = ExportData["statusHistory"][number];
export type AdminRow = ExportData["admins"][number];

export type ExcelExportInput = ExportData;

type ColumnDef<T> = {
  header: string;
  key: keyof T & string;
  width: number;
  format?: (value: unknown) => unknown;
};

/** Decimal columns are Prisma `Decimal`, not `number`. */
const formatDecimal = (v: unknown) => (v ? String(v) : "");

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

const formatDate = (v: unknown) => (v ? (v as Date).toISOString() : "");
const formatBool = (v: unknown) => (v ? "Yes" : "No");

const formatOrderNumber = (v: unknown) => (v as { orderNumber?: string } | null)?.orderNumber ?? "";
const formatCategoryName = (v: unknown) => (v as { name?: string } | null)?.name ?? "";

function createSheet<T>(workbook: Excel.Workbook, name: string, data: T[], columns: ColumnDef<T>[]) {
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

function addLookupSheet(workbook: Excel.Workbook, input: ExcelExportInput) {
  const lookupSheet = workbook.addWorksheet("ID Lookup");
  lookupSheet.addRow(["Table", "ID", "Name/Identifier"]);
  lookupSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });
  for (const cat of input.categories) lookupSheet.addRow(["Category", cat.id, cat.name]);
  for (const prod of input.products) lookupSheet.addRow(["Product", prod.id, `${prod.sku || "N/A"} - ${prod.name}`]);
  for (const order of input.orders) lookupSheet.addRow(["Order", order.id, order.orderNumber]);
  for (const admin of input.admins) lookupSheet.addRow(["Admin", admin.id, `${admin.username} (${admin.email})`]);
  lookupSheet.getColumn(1).width = 15;
  lookupSheet.getColumn(2).width = 40;
  lookupSheet.getColumn(3).width = 50;
}

const categoryColumns: ColumnDef<CategoryRow>[] = [
  { header: "ID", key: "id", width: 8 },
  { header: "Name", key: "name", width: 25 },
  { header: "Slug", key: "slug", width: 20 },
  { header: "Description", key: "description", width: 40 },
  { header: "Display Order", key: "displayOrder", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

const productColumns: ColumnDef<ProductRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "SKU", key: "sku", width: 15 },
  { header: "Name", key: "name", width: 40 },
  { header: "Category ID", key: "categoryId", width: 10 },
  { header: "Category Name", key: "category", width: 25, format: formatCategoryName },
  { header: "Description", key: "description", width: 50 },
  { header: "Price", key: "price", width: 12, format: formatDecimal },
  { header: "Compare At Price", key: "compareAtPrice", width: 18, format: formatDecimal },
  { header: "Stock Quantity", key: "stockQuantity", width: 18 },
  { header: "Image URL", key: "imageUrl", width: 50 },
  { header: "Badge", key: "badge", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Allow Gift Box Bundling", key: "allowGiftBoxBundling", width: 20, format: formatBool },
  { header: "Visible Hostnames", key: "visibleHostnames", width: 40 },
  { header: "Deleted At", key: "deletedAt", width: 20, format: formatDate },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

const productImageColumns: ColumnDef<ProductImageRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Product ID", key: "productId", width: 36 },
  { header: "URL", key: "url", width: 60 },
  { header: "Is Primary", key: "isPrimary", width: 12, format: formatBool },
  { header: "Display Order", key: "displayOrder", width: 15 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const orderColumns: ColumnDef<OrderRow>[] = [
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
  { header: "Subtotal", key: "subtotal", width: 12, format: formatDecimal },
  { header: "Shipping Cost", key: "shippingCost", width: 15, format: formatDecimal },
  { header: "Total Amount", key: "totalAmount", width: 15, format: formatDecimal },
  { header: "Transaction ID", key: "transactionId", width: 30 },
  { header: "Customer Notes", key: "customerNotes", width: 40 },
  { header: "Admin Notes", key: "adminNotes", width: 40 },
  { header: "Version", key: "version", width: 8 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

const orderItemColumns: ColumnDef<OrderItemRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Order ID", key: "orderId", width: 36 },
  { header: "Order Number", key: "order", width: 20, format: formatOrderNumber },
  { header: "Product ID", key: "productId", width: 36 },
  { header: "Product Name", key: "productName", width: 40 },
  { header: "Unit Price", key: "unitPrice", width: 12, format: formatDecimal },
  { header: "Quantity", key: "quantity", width: 10 },
  { header: "Parent Order Item ID", key: "parentOrderItemId", width: 36 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const statusHistoryColumns: ColumnDef<StatusHistoryRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Order ID", key: "orderId", width: 36 },
  { header: "Order Number", key: "order", width: 20, format: formatOrderNumber },
  { header: "Status", key: "status", width: 15 },
  { header: "Notes", key: "notes", width: 50 },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
];

const adminColumns: ColumnDef<AdminRow>[] = [
  { header: "ID", key: "id", width: 36 },
  { header: "Username", key: "username", width: 20 },
  { header: "Email", key: "email", width: 35 },
  { header: "Role", key: "role", width: 15 },
  { header: "Is Active", key: "isActive", width: 12, format: formatBool },
  { header: "Last Login At", key: "lastLoginAt", width: 20, format: (v) => (v ? formatDate(v) : "Never") },
  { header: "Created At", key: "createdAt", width: 20, format: formatDate },
  { header: "Updated At", key: "updatedAt", width: 20, format: formatDate },
];

export function buildWorkbook(input: ExcelExportInput): Excel.Workbook {
  const workbook = new Excel.Workbook();
  workbook.creator = "Chinni Treasure";
  workbook.created = new Date();

  createSheet(workbook, "Categories", input.categories, categoryColumns);
  createSheet(workbook, "Products", input.products, productColumns);
  createSheet(workbook, "Product Images", input.productImages, productImageColumns);
  createSheet(workbook, "Orders", input.orders, orderColumns);
  createSheet(workbook, "Order Items", input.orderItems, orderItemColumns);
  createSheet(workbook, "Order Status History", input.statusHistory, statusHistoryColumns);
  createSheet(workbook, "Admins", input.admins, adminColumns);
  addLookupSheet(workbook, input);

  return workbook;
}