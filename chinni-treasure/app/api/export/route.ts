import { NextResponse } from "next/server";
import { logger } from "@/lib/axiom/server";
import { dumpDatabase } from "@/src/lib/export-read";
import { buildWorkbook } from "@/src/lib/excel-export";
import { withAdmin } from "@/src/lib/route-guard";

// GET /api/export — Full data export as Excel (admin only).
// The adapter holds headers only; the dump queries live in export-read.ts and
// the workbook build in excel-export.ts.
export const GET = withAdmin(async () => {
  try {
    const data = await dumpDatabase();

    const workbook = buildWorkbook(data);
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
    logger.error("Export failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
});