import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Users
  const users = [
    {
      name: 'System Admin',
      loginId: 'admin01',
      email: 'admin@stocksense.local',
      role: 'ADMIN',
      password: 'Admin@1234',
    },
    {
      name: 'Inventory Manager',
      loginId: 'manager01',
      email: 'manager@stocksense.local',
      role: 'MANAGER',
      password: 'Manager@1234',
    },
    {
      name: 'Warehouse Operator',
      loginId: 'staff001',
      email: 'staff@stocksense.local',
      role: 'STAFF',
      password: 'Staff@1234',
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { loginId: u.loginId },
      update: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash,
        isActive: true,
      },
      create: {
        name: u.name,
        loginId: u.loginId,
        email: u.email,
        role: u.role,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`  ✓ User created/updated: ${u.loginId} (${u.role})`);
  }

  // 2. Virtual Locations (no warehouseId)
  const virtuals = [
    { name: 'Vendors', shortCode: 'VENDORS', type: 'VENDOR' },
    { name: 'Customers', shortCode: 'CUSTOMERS', type: 'CUSTOMER' },
    { name: 'Inventory Adjustment', shortCode: 'ADJUST', type: 'ADJUSTMENT' },
  ];

  for (const vl of virtuals) {
    const existing = await prisma.location.findFirst({
      where: { type: vl.type, warehouseId: null },
    });
    if (existing) {
      await prisma.location.update({
        where: { id: existing.id },
        data: { name: vl.name, shortCode: vl.shortCode, isActive: true },
      });
    } else {
      await prisma.location.create({
        data: {
          name: vl.name,
          shortCode: vl.shortCode,
          type: vl.type,
          warehouseId: null,
          isActive: true,
        },
      });
    }
    console.log(`  ✓ Virtual location created/updated: ${vl.name} (${vl.type})`);
  }

  // 3. Warehouse 1: Main Warehouse (WH)
  let wh1 = await prisma.warehouse.findUnique({ where: { shortCode: 'WH' } });
  if (!wh1) {
    wh1 = await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        shortCode: 'WH',
        address: 'Sector 5, Industrial Area, Ahmedabad, Gujarat',
        isActive: true,
      },
    });
  } else {
    wh1 = await prisma.warehouse.update({
      where: { id: wh1.id },
      data: {
        name: 'Main Warehouse',
        address: 'Sector 5, Industrial Area, Ahmedabad, Gujarat',
        isActive: true,
      },
    });
  }

  const wh1Locations = [
    { name: 'Stock', shortCode: 'STOCK', type: 'INTERNAL', isDefault: true, capacity: 500 },
    { name: 'Rack A', shortCode: 'RACK-A', type: 'INTERNAL', isDefault: false, capacity: 60 },
    { name: 'Rack B', shortCode: 'RACK-B', type: 'INTERNAL', isDefault: false, capacity: 200 },
    { name: 'Production Floor', shortCode: 'PROD', type: 'INTERNAL', isDefault: false, capacity: 50 },
  ];

  let wh1DefaultLocId = null;
  for (const loc of wh1Locations) {
    const createdLoc = await prisma.location.upsert({
      where: {
        warehouseId_shortCode: {
          warehouseId: wh1.id,
          shortCode: loc.shortCode,
        },
      },
      update: { name: loc.name, type: loc.type, capacity: loc.capacity, isActive: true },
      create: {
        name: loc.name,
        shortCode: loc.shortCode,
        type: loc.type,
        capacity: loc.capacity,
        warehouseId: wh1.id,
        isActive: true,
      },
    });
    if (loc.isDefault) {
      wh1DefaultLocId = createdLoc.id;
    }
    console.log(`  ✓ Location: WH/${loc.shortCode} (${loc.name})`);
  }

  if (wh1DefaultLocId) {
    await prisma.warehouse.update({
      where: { id: wh1.id },
      data: { defaultLocationId: wh1DefaultLocId },
    });
  }

  // 4. Warehouse 2: Second Warehouse (WH2)
  let wh2 = await prisma.warehouse.findUnique({ where: { shortCode: 'WH2' } });
  if (!wh2) {
    wh2 = await prisma.warehouse.create({
      data: {
        name: 'Second Warehouse',
        shortCode: 'WH2',
        address: 'Plot 12, Logistics Park, Sanand, Gujarat',
        isActive: true,
      },
    });
  } else {
    wh2 = await prisma.warehouse.update({
      where: { id: wh2.id },
      data: {
        name: 'Second Warehouse',
        address: 'Plot 12, Logistics Park, Sanand, Gujarat',
        isActive: true,
      },
    });
  }

  const wh2Stock = await prisma.location.upsert({
    where: {
      warehouseId_shortCode: {
        warehouseId: wh2.id,
        shortCode: 'STOCK',
      },
    },
    update: { name: 'Stock', type: 'INTERNAL', isActive: true },
    create: {
      name: 'Stock',
      shortCode: 'STOCK',
      type: 'INTERNAL',
      warehouseId: wh2.id,
      isActive: true,
    },
  });
  console.log(`  ✓ Location: WH2/STOCK (Stock)`);

  await prisma.warehouse.update({
    where: { id: wh2.id },
    data: { defaultLocationId: wh2Stock.id },
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
