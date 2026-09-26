import { prisma } from '../src/lib/prisma.js';
import { applyMoves, getVirtualLocation } from '../src/services/stock.service.js';
import { nextReference } from '../src/services/sequence.service.js';

async function seedDemo() {
  console.log('🌱 Starting StockSense Demo Seed...');

  // 1. Clear transactional and master tables (keep Users, Warehouses, Locations)
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.stockMove.deleteMany({});
  await prisma.stockQuant.deleteMany({});
  await prisma.operationLine.deleteMany({});
  await prisma.operation.deleteMany({});
  await prisma.reorderRule.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.sequenceCounter.deleteMany({});

  console.log('  ✓ Cleaned transactional tables');

  // Fetch admin user and locations
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const userId = adminUser?.id || null;

  const whMain = await prisma.warehouse.findFirst({ where: { shortCode: 'WH' } });
  const wh2 = await prisma.warehouse.findFirst({ where: { shortCode: 'WH2' } });

  const locWhStock = await prisma.location.findFirst({ where: { shortCode: 'STOCK', warehouseId: whMain.id } });
  const locWhRackA = await prisma.location.findFirst({ where: { shortCode: 'RACK-A', warehouseId: whMain.id } });
  const locWhProd = await prisma.location.findFirst({ where: { shortCode: 'PROD', warehouseId: whMain.id } });
  const locWh2Stock = await prisma.location.findFirst({ where: { shortCode: 'STOCK', warehouseId: wh2.id } });

  const locVendor = await getVirtualLocation('VENDOR');
  const locCustomer = await getVirtualLocation('CUSTOMER');
  const locAdjustment = await getVirtualLocation('ADJUSTMENT');

  // 2. Insert 6 Categories
  const categoriesData = [
    { name: 'Furniture', description: 'Office and ergonomics furniture' },
    { name: 'Raw Material', description: 'Steel, wood, and industrial raw items' },
    { name: 'Hardware', description: 'Fasteners, screws, and metallic parts' },
    { name: 'Electronics', description: 'Computers, displays, and wiring' },
    { name: 'Packaging', description: 'Boxes, bubble wrap, and tape' },
    { name: 'Office Supplies', description: 'Stationery and paper products' },
  ];

  const catMap = new Map();
  for (const c of categoriesData) {
    const cat = await prisma.category.create({ data: c });
    catMap.set(c.name, cat.id);
  }
  console.log('  ✓ 6 Categories created');

  // 3. Insert 8 Contacts
  const contactsData = [
    { name: 'Azure Interior', type: 'CUSTOMER', email: 'orders@azureinterior.in', phone: '9820012345', address: 'Mumbai, MH', gstin: '27AAAAA0000A1Z5' },
    { name: 'Tata Steel Industrial Supply', type: 'VENDOR', email: 'sales@tatasteel.com', phone: '9811122233', address: 'Jamshedpur, JH', gstin: '20AAAAA1111A1Z2' },
    { name: 'Supreme Fasteners Pvt Ltd', type: 'VENDOR', email: 'contact@supremefasteners.in', phone: '9876543210', address: 'Pune, MH', gstin: '27BBBBB2222B1Z8' },
    { name: 'Reliance Packaging Ltd', type: 'VENDOR', email: 'info@reliancepack.in', phone: '9765432109', address: 'Ahmedabad, GJ', gstin: '24CCCCC3333C1Z1' },
    { name: 'Godrej Office Automation', type: 'BOTH', email: 'support@godrejoffice.in', phone: '9654321098', address: 'Bengaluru, KA', gstin: '29DDDDD4444D1Z4' },
    { name: 'Decora Furnishings', type: 'CUSTOMER', email: 'admin@decorafurnishings.com', phone: '9543210987', address: 'Delhi, DL', gstin: '07EEEEE5555E1Z7' },
    { name: 'Infosys Facilities Tech', type: 'CUSTOMER', email: 'procurement@infosys.com', phone: '9432109876', address: 'Hyderabad, TS', gstin: '36FFFFF6666F1Z9' },
    { name: 'Apex Electronics Supplies', type: 'VENDOR', email: 'sales@apexelectronics.in', phone: '9321098765', address: 'Chennai, TN', gstin: '33GGGGG7777G1Z3' },
  ];

  const contactMap = new Map();
  for (const c of contactsData) {
    const contact = await prisma.contact.create({ data: c });
    contactMap.set(c.name, contact.id);
  }
  console.log('  ✓ 8 Contacts created');

  // 4. Insert 25 Products
  const productsData = [
    { name: 'Executive Wooden Desk', sku: 'DESK001', categoryName: 'Furniture', uom: 'Units', costPrice: 15000, salePrice: 22000, barcode: '890100100001' },
    { name: 'Ergonomic Mesh Chair', sku: 'CHAIR001', categoryName: 'Furniture', uom: 'Units', costPrice: 6500, salePrice: 9900, barcode: '890100100002' },
    { name: 'Conference Table 8-Seater', sku: 'TABLE001', categoryName: 'Furniture', uom: 'Units', costPrice: 32000, salePrice: 48000, barcode: '890100100003' },
    { name: 'Steel Rods 12mm High Tensile', sku: 'STEEL001', categoryName: 'Raw Material', uom: 'kg', costPrice: 65, salePrice: 90, barcode: '890100200001' },
    { name: 'Aluminum Sheet 2mm 4x8ft', sku: 'ALUM001', categoryName: 'Raw Material', uom: 'Units', costPrice: 2400, salePrice: 3500, barcode: '890100200002' },
    { name: 'Industrial Hardwood Timber', sku: 'WOOD001', categoryName: 'Raw Material', uom: 'm', costPrice: 450, salePrice: 700, barcode: '890100200003' },
    { name: 'Hex Bolts M8 x 50mm (Pack of 100)', sku: 'BOLT001', categoryName: 'Hardware', uom: 'pack', costPrice: 180, salePrice: 280, barcode: '890100300001' },
    { name: 'Stainless Steel Washers M8', sku: 'WASH001', categoryName: 'Hardware', uom: 'box', costPrice: 120, salePrice: 200, barcode: '890100300002' },
    { name: 'Heavy Duty Door Hinges 4-inch', sku: 'HINGE001', categoryName: 'Hardware', uom: 'box', costPrice: 350, salePrice: 550, barcode: '890100300003' },
    { name: 'Dell 27-inch IPS Monitor', sku: 'MON001', categoryName: 'Electronics', uom: 'Units', costPrice: 14500, salePrice: 19500, barcode: '890100400001' },
    { name: 'Logitech Wireless Keyboard & Mouse', sku: 'KM001', categoryName: 'Electronics', uom: 'box', costPrice: 1400, salePrice: 2200, barcode: '890100400002' },
    { name: 'Cat6 Ethernet Cable 305m Roll', sku: 'CABLE001', categoryName: 'Electronics', uom: 'Units', costPrice: 4200, salePrice: 6000, barcode: '890100400003' },
    { name: 'Heavy Corrugated Shipping Box L', sku: 'BOX001', categoryName: 'Packaging', uom: 'box', costPrice: 45, salePrice: 75, barcode: '890100500001' },
    { name: 'Bubble Wrap Roll 100m', sku: 'BUBBLE001', categoryName: 'Packaging', uom: 'Units', costPrice: 650, salePrice: 950, barcode: '890100500002' },
    { name: 'Industrial Packing Tape 2-inch', sku: 'TAPE001', categoryName: 'Packaging', uom: 'box', costPrice: 220, salePrice: 360, barcode: '890100500003' },
    { name: 'A4 Copier Paper 80GSM (5 Reams)', sku: 'PAPER001', categoryName: 'Office Supplies', uom: 'box', costPrice: 1150, salePrice: 1600, barcode: '890100600001' },
    { name: 'Gel Pens Black (Pack of 50)', sku: 'PEN001', categoryName: 'Office Supplies', uom: 'box', costPrice: 300, salePrice: 500, barcode: '890100600002' },
    { name: 'Office Metal Stapler Heavy Duty', sku: 'STAPLE001', categoryName: 'Office Supplies', uom: 'Units', costPrice: 250, salePrice: 420, barcode: '890100600003' },
    { name: 'Adjustable Standing Desk Frame', sku: 'STDESK001', categoryName: 'Furniture', uom: 'Units', costPrice: 18500, salePrice: 27000, barcode: '890100100004' },
    { name: 'Filing Cabinet 4-Drawer Steel', sku: 'CABINET001', categoryName: 'Furniture', uom: 'Units', costPrice: 8500, salePrice: 13000, barcode: '890100100005' },
    { name: 'Brass Threaded Rod M10', sku: 'ROD002', categoryName: 'Hardware', uom: 'm', costPrice: 210, salePrice: 340, barcode: '890100300004' },
    { name: 'HDMI 2.1 Braided Cable 3m', sku: 'HDMI001', categoryName: 'Electronics', uom: 'Units', costPrice: 380, salePrice: 690, barcode: '890100400004' },
    { name: 'Stretch Film Wrap 500mm', sku: 'FILM001', categoryName: 'Packaging', uom: 'Units', costPrice: 320, salePrice: 520, barcode: '890100500004' },
    { name: 'Sticky Notes Yellow (Pack of 12)', sku: 'NOTES001', categoryName: 'Office Supplies', uom: 'pack', costPrice: 140, salePrice: 240, barcode: '890100600004' },
    { name: 'Copper Wire 1.5 sq mm Roll', sku: 'WIRE001', categoryName: 'Raw Material', uom: 'm', costPrice: 18, salePrice: 28, barcode: '890100200004' },
  ];

  const prodMap = new Map();
  for (const p of productsData) {
    const { categoryName, ...rest } = p;
    const prod = await prisma.product.create({
      data: {
        ...rest,
        categoryId: catMap.get(categoryName),
      },
    });
    prodMap.set(p.sku, prod);
  }
  console.log('  ✓ 25 Products created');

  // 5. Insert Reorder Rules
  const rulesData = [
    { sku: 'DESK001', warehouseId: whMain.id, minQty: 5, maxQty: 20, vendorName: 'Tata Steel Industrial Supply' },
    { sku: 'CHAIR001', warehouseId: whMain.id, minQty: 8, maxQty: 30, vendorName: 'Godrej Office Automation' },
    { sku: 'STEEL001', warehouseId: whMain.id, minQty: 50, maxQty: 300, vendorName: 'Tata Steel Industrial Supply' },
    { sku: 'BOLT001', warehouseId: whMain.id, minQty: 10, maxQty: 50, vendorName: 'Supreme Fasteners Pvt Ltd' },
    { sku: 'MON001', warehouseId: whMain.id, minQty: 3, maxQty: 15, vendorName: 'Apex Electronics Supplies' },
    { sku: 'BOX001', warehouseId: whMain.id, minQty: 20, maxQty: 100, vendorName: 'Reliance Packaging Ltd' },
    { sku: 'PAPER001', warehouseId: whMain.id, minQty: 4, maxQty: 25, vendorName: 'Godrej Office Automation' },
    { sku: 'STEEL001', warehouseId: wh2.id, minQty: 30, maxQty: 150, vendorName: 'Tata Steel Industrial Supply' },
  ];

  for (const r of rulesData) {
    const p = prodMap.get(r.sku);
    await prisma.reorderRule.create({
      data: {
        productId: p.id,
        warehouseId: r.warehouseId,
        minQty: r.minQty,
        maxQty: r.maxQty,
        preferredVendorId: contactMap.get(r.vendorName),
      },
    });
  }
  console.log('  ✓ Reorder rules created');

  // 6. Build 30 days of Stock Ledger Movements using stockService.applyMoves & sequence.service
  console.log('  ⏳ Applying stock movements and building history ledger...');

  const today = new Date();

  // Initial Stock setup for products via applyMoves from ADJUSTMENT
  const initialStockList = [
    { sku: 'DESK001', qty: 15, locId: locWhStock.id },
    { sku: 'CHAIR001', qty: 25, locId: locWhStock.id },
    { sku: 'TABLE001', qty: 4, locId: locWhStock.id },
    { sku: 'STEEL001', qty: 200, locId: locWhStock.id },
    { sku: 'STEEL001', qty: 50, locId: locWh2Stock.id },
    { sku: 'ALUM001', qty: 12, locId: locWhRackA.id },
    { sku: 'BOLT001', qty: 40, locId: locWhRackA.id },
    { sku: 'MON001', qty: 10, locId: locWhStock.id },
    { sku: 'KM001', qty: 18, locId: locWhStock.id },
    { sku: 'BOX001', qty: 85, locId: locWhStock.id },
    { sku: 'BUBBLE001', qty: 15, locId: locWhStock.id },
    { sku: 'PAPER001', qty: 20, locId: locWhStock.id },
    { sku: 'STDESK001', qty: 2, locId: locWhStock.id }, // Low stock!
    { sku: 'CABINET001', qty: 0, locId: locWhStock.id }, // Out of stock!
  ];

  for (const item of initialStockList) {
    const p = prodMap.get(item.sku);
    if (item.qty > 0) {
      await prisma.$transaction(async (tx) => {
        const ref = await nextReference(tx, whMain.id, 'ADJUSTMENT');
        await applyMoves(tx, {
          moves: [{ productId: p.id, fromLocationId: locAdjustment.id, toLocationId: item.locId, quantity: item.qty, unitCost: p.costPrice }],
          reference: ref,
          type: 'ADJUSTMENT',
          userId,
        });
      });
    }
  }

  // Historic Completed Operations (DONE) over last 20 days
  const doneOps = [
    {
      type: 'RECEIPT',
      whId: whMain.id,
      contact: 'Tata Steel Industrial Supply',
      sourceId: locVendor.id,
      destId: locWhStock.id,
      daysAgo: 20,
      lines: [{ sku: 'STEEL001', qty: 100 }],
    },
    {
      type: 'DELIVERY',
      whId: whMain.id,
      contact: 'Azure Interior',
      sourceId: locWhStock.id,
      destId: locCustomer.id,
      daysAgo: 15,
      lines: [
        { sku: 'DESK001', qty: 3 },
        { sku: 'CHAIR001', qty: 6 },
      ],
    },
    {
      type: 'INTERNAL',
      whId: whMain.id,
      contact: null,
      sourceId: locWhStock.id,
      destId: locWhProd.id,
      daysAgo: 10,
      lines: [{ sku: 'STEEL001', qty: 40 }],
    },
    {
      type: 'DELIVERY',
      whId: whMain.id,
      contact: 'Decora Furnishings',
      sourceId: locWhProd.id,
      destId: locCustomer.id,
      daysAgo: 5,
      lines: [{ sku: 'STEEL001', qty: 20 }],
    },
  ];

  for (const opInfo of doneOps) {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() - opInfo.daysAgo);

    await prisma.$transaction(async (tx) => {
      const ref = await nextReference(tx, opInfo.whId, opInfo.type);
      const op = await tx.operation.create({
        data: {
          reference: ref,
          type: opInfo.type,
          status: 'DONE',
          warehouseId: opInfo.whId,
          contactId: opInfo.contact ? contactMap.get(opInfo.contact) : null,
          sourceLocationId: opInfo.sourceId,
          destLocationId: opInfo.destId,
          scheduledDate,
          createdById: userId,
          validatedById: userId,
          validatedAt: scheduledDate,
          lines: {
            create: opInfo.lines.map((l) => ({
              productId: prodMap.get(l.sku).id,
              quantity: l.qty,
            })),
          },
        },
        include: { lines: true },
      });

      const moves = op.lines.map((line) => {
        const p = prodMap.get(opInfo.lines.find((l) => prodMap.get(l.sku).id === line.productId).sku);
        return {
          productId: line.productId,
          fromLocationId: opInfo.sourceId,
          toLocationId: opInfo.destId,
          quantity: line.quantity,
          unitCost: p.costPrice,
          operationLineId: line.id,
        };
      });

      await applyMoves(tx, { moves, reference: ref, type: opInfo.type, operationId: op.id, userId });
    });
  }

  // 7. Active Pending Operations (DRAFT, WAITING, READY, LATE)
  const pendingOpsData = [
    {
      type: 'RECEIPT',
      status: 'READY',
      whId: whMain.id,
      contact: 'Tata Steel Industrial Supply',
      sourceId: locVendor.id,
      destId: locWhStock.id,
      daysAgo: -2, // Scheduled 2 days in future
      lines: [{ sku: 'STEEL001', qty: 150 }],
    },
    {
      type: 'RECEIPT',
      status: 'READY',
      whId: whMain.id,
      contact: 'Godrej Office Automation',
      sourceId: locVendor.id,
      destId: locWhStock.id,
      daysAgo: 3, // LATE! Scheduled 3 days ago
      lines: [{ sku: 'CHAIR001', qty: 10 }],
    },
    {
      type: 'DELIVERY',
      status: 'READY',
      whId: whMain.id,
      contact: 'Azure Interior',
      sourceId: locWhStock.id,
      destId: locCustomer.id,
      daysAgo: -1,
      lines: [
        { sku: 'DESK001', qty: 2 },
        { sku: 'MON001', qty: 2 },
      ],
    },
    {
      type: 'DELIVERY',
      status: 'WAITING',
      whId: whMain.id,
      contact: 'Infosys Facilities Tech',
      sourceId: locWhStock.id,
      destId: locCustomer.id,
      daysAgo: 2, // LATE & WAITING!
      lines: [{ sku: 'CABINET001', qty: 5 }], // Out of stock
    },
    {
      type: 'INTERNAL',
      status: 'READY',
      whId: whMain.id,
      contact: null,
      sourceId: locWhStock.id,
      destId: locWhRackA.id,
      daysAgo: -3,
      lines: [{ sku: 'BOX001', qty: 20 }],
    },
    {
      type: 'DELIVERY',
      status: 'DRAFT',
      whId: whMain.id,
      contact: 'Decora Furnishings',
      sourceId: locWhStock.id,
      destId: locCustomer.id,
      daysAgo: -4,
      lines: [{ sku: 'PAPER001', qty: 5 }],
    },
  ];

  for (const opInfo of pendingOpsData) {
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() - opInfo.daysAgo);

    await prisma.$transaction(async (tx) => {
      const ref = await nextReference(tx, opInfo.whId, opInfo.type);
      await tx.operation.create({
        data: {
          reference: ref,
          type: opInfo.type,
          status: opInfo.status,
          warehouseId: opInfo.whId,
          contactId: opInfo.contact ? contactMap.get(opInfo.contact) : null,
          sourceLocationId: opInfo.sourceId,
          destLocationId: opInfo.destId,
          scheduledDate,
          createdById: userId,
          lines: {
            create: opInfo.lines.map((l) => ({
              productId: prodMap.get(l.sku).id,
              quantity: l.qty,
            })),
          },
        },
      });
    });
  }

  console.log('  ✓ Pending and Late operations created');

  console.log('✅ Demo Seed Complete! Every dashboard metric and chart is non-zero and populated.');
}

seedDemo()
  .catch((err) => {
    console.error('❌ Demo Seed Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
