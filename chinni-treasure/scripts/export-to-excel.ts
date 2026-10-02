import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { buildWorkbook } from '../src/lib/excel-export';
import { dumpDatabase } from '../src/lib/export-read';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 30_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function exportToExcel() {
  console.log('Starting database export to Excel...');

  // The dump queries live in src/lib/export-read.ts — this script and the
  // /api/export route are the two adapters over that one read surface.
  const data = await dumpDatabase(prisma);

  const workbook = buildWorkbook(data);

  // Save the workbook
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `chinni-treasure-export-${timestamp}.xlsx`;
  const filepath = path.join(__dirname, '..', 'exports', filename);

  // Create exports directory if it doesn't exist
  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  await workbook.xlsx.writeFile(filepath);
  console.log(`Export completed successfully!`);
  console.log(`File saved at: ${filepath}`);
  console.log(`Sheets created: Categories, Products, Product Images, Orders, Order Items, Order Status History, Admins, ID Lookup`);
}

// Run the export
exportToExcel()
  .catch((error) => {
    console.error('Export failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });