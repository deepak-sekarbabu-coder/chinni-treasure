import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { buildWorkbook } from '../src/lib/excel-export';
import { dumpDatabase } from '../src/lib/export-read';
import { createPrismaConnection } from '../src/lib/prisma';

// Load environment variables
dotenv.config();

// The connection policy (pool sizing, sslmode normalisation) is prisma.ts's,
// shared with the app. The script used to build its own Pool/PrismaPg/PrismaClient
// with different numbers and no normalisation.
const { client, close } = createPrismaConnection();

async function exportToExcel() {
  console.log('Starting database export to Excel...');

  // The dump queries live in src/lib/export-read.ts — this script and the
  // /api/export route are the two adapters over that one read surface.
  const data = await dumpDatabase(client);

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
  .finally(close);