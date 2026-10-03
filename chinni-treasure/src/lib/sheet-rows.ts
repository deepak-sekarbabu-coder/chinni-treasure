import type ExcelJS from "exceljs";

/**
 * Decode a sheet into rows keyed by its header text, lowercased and trimmed.
 *
 * The exporter (`src/lib/excel-export.ts`) declares every column as
 * `ColumnDef.header`; this reads by that header instead of by cell index, so a
 * column added, removed or reordered upstream is one edit in the importer
 * instead of a silent misread. The previous positional reads (`getCell(3)`, and
 * the `buildProductColMap` fallbacks that guessed `idx["image url"] - 1`) had
 * already drifted out of step with the exporter's column order.
 *
 * Lives here, not in `scripts/generate-seed-from-excel.ts`, so the round-trip
 * test imports the importer's real decoder instead of keeping a copy of it —
 * a copied decoder goes stale silently and guards nothing.
 */
export function sheetRows(wb: ExcelJS.Workbook, name: string): Record<string, unknown>[] {
  const sheet = wb.getWorksheet(name);
  if (!sheet) return [];
  const header = sheet.getRow(1);
  const keys: string[] = [];
  header.eachCell((cell, col) => {
    keys[col - 1] = String(cell.value ?? "").toLowerCase().trim();
  });
  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const record: Record<string, unknown> = {};
    keys.forEach((key, idx) => {
      if (key) record[key] = row.getCell(idx + 1).value;
    });
    rows.push(record);
  });
  return rows;
}