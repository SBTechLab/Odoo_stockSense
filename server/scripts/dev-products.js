/**
 * dev-products.js — Temporary dev script to insert 3 test products.
 * Member 3 will build the real product module.
 * Run: node server/scripts/dev-products.js
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const products = [
  { name: 'Structural Steel Rods', sku: 'STEEL-ROD-001', uom: 'kg', costPrice: 65.0, salePrice: 80.0, description: 'High-tensile structural steel rods for construction' },
  { name: 'Aluminium Sheets 2mm', sku: 'ALU-SHEET-2MM', uom: 'kg', costPrice: 120.0, salePrice: 150.0, description: '2mm aluminium sheets for fabrication' },
  { name: 'Copper Wire 1.5mm', sku: 'CU-WIRE-1.5', uom: 'm', costPrice: 45.0, salePrice: 60.0, description: '1.5mm copper electrical wire' },
];

async function main() {
  console.log('Inserting test products...');
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    console.log(`  ✓ ${product.sku} — ${product.name} (id: ${product.id})`);
  }
  console.log('Done. 3 test products ready.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
