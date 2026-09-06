import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { buildWorkbook } from '../src/lib/excel-export';

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

  const categories = await prisma.category.findMany({ orderBy: { displayOrder: 'asc' } });
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { displayOrder: 'asc' } } },
  });
  const productImages = await prisma.productImage.findMany({ orderBy: { createdAt: 'asc' } });
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  const orderItems = await prisma.orderItem.findMany({
    include: { order: { select: { orderNumber: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const statusHistory = await prisma.orderStatusHistory.findMany({
    include: { order: { select: { orderNumber: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' } });

  const workbook = buildWorkbook({ categories, products, productImages, orders, orderItems, statusHistory, admins });

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