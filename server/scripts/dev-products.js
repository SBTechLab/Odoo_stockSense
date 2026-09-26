import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('📦 Seeding temporary dev products for testing...');

  const products = [
    {
      name: 'Steel Sheets 2mm',
      sku: 'STEEL-SHEET',
      uom: 'kg',
      costPrice: 50.0,
      salePrice: 75.0,
      description: 'Cold rolled steel sheets 2mm thickness',
    },
    {
      name: 'M4 Stainless Hex Screws',
      sku: 'SCREW-M4',
      uom: 'Units',
      costPrice: 0.5,
      salePrice: 1.2,
      description: 'Standard M4 stainless steel hex screws',
    },
    {
      name: 'HDPE Plastic Granules',
      sku: 'PLASTIC-HDPE',
      uom: 'kg',
      costPrice: 30.0,
      salePrice: 48.0,
      description: 'High-density polyethylene raw plastic pellets',
    },
  ];

  for (const p of products) {
    const record = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        uom: p.uom,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        description: p.description,
        isActive: true,
      },
      create: {
        name: p.name,
        sku: p.sku,
        uom: p.uom,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        description: p.description,
        isActive: true,
      },
    });
    console.log(`  ✓ Product seeded: ${record.name} (${record.sku}) [${record.id}]`);
  }

  console.log('✅ Dev products seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding dev products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
