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

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("chinni-treasure-export-2026-07-18.xlsx");

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
  const products: {
    sku: string;
    name: string;
    categorySlug: string;
    price: number;
    stockQuantity: number;
    imageUrl: string | null;
    description: string | null;
    badge: string | null;
  }[] = [];
  prodSheet.eachRow((row, i) => {
    if (i === 1) return;
    products.push({
      sku: String(row.getCell(2).value || ""),
      name: String(row.getCell(3).value || ""),
      categorySlug: "", // Will be filled
      price: parseNum(row.getCell(7).value),
      stockQuantity: parseNum(row.getCell(8).value),
      imageUrl: row.getCell(9).value ? String(row.getCell(9).value) : null,
      description: row.getCell(6).value
        ? String(row.getCell(6).value)
        : null,
      badge: row.getCell(10).value ? String(row.getCell(10).value) : null,
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

  // Output as TypeScript
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
      compareAtPrice: null,
      additionalImages: p.imageUrl ? [p.imageUrl] : [],
    })),
    null,
    2,
  )};
`;

  const fs = await import("fs");
  fs.writeFileSync("prisma/seed-data.ts", output);
  console.log("Generated prisma/seed-data.ts");
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products: ${products.length}`);
}

main().catch(console.error);
