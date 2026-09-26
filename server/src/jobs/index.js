import { prisma } from '../lib/prisma.js';
import { eventBus } from '../lib/eventBus.js';
import { getOnHand } from '../services/stock.service.js';
import { toNumber } from '../lib/serialize.js';

export async function checkProductStockStatus(productIds) {
  try {
    const where = {
      isActive: true,
      ...(productIds?.length ? { id: { in: productIds } } : {}),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        reorderRules: { include: { warehouse: true } },
      },
    });

    for (const product of products) {
      const totalOnHand = await getOnHand(product.id);

      if (totalOnHand === 0) {
        const existingUnread = await prisma.notification.findFirst({
          where: {
            type: 'OUT_OF_STOCK',
            productId: product.id,
            readAt: null,
          },
        });

        if (!existingUnread) {
          const notification = await prisma.notification.create({
            data: {
              type: 'OUT_OF_STOCK',
              title: `Out of Stock: ${product.name}`,
              message: `${product.name} (SKU: ${product.sku}) has 0 units remaining.`,
              link: `/products/${product.id}`,
              productId: product.id,
            },
          });
          eventBus.emit('notification.created', notification);
        }
      } else if (product.reorderRules && product.reorderRules.length > 0) {
        for (const rule of product.reorderRules) {
          const whOnHand = await getOnHand(product.id, { warehouseId: rule.warehouseId });
          const minQty = toNumber(rule.minQty);

          if (whOnHand <= minQty) {
            const existingUnread = await prisma.notification.findFirst({
              where: {
                type: 'LOW_STOCK',
                productId: product.id,
                readAt: null,
              },
            });

            if (!existingUnread) {
              const notification = await prisma.notification.create({
                data: {
                  type: 'LOW_STOCK',
                  title: `Low Stock Alert: ${product.name}`,
                  message: `${product.name} (SKU: ${product.sku}) is low on stock (${whOnHand} ${product.uom} <= min ${minQty}) at ${rule.warehouse.name}.`,
                  link: `/products/${product.id}`,
                  productId: product.id,
                },
              });
              eventBus.emit('notification.created', notification);
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error running checkProductStockStatus job:', err);
  }
}

export async function checkLateOperations() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const lateOps = await prisma.operation.findMany({
      where: {
        status: { notIn: ['DONE', 'CANCELED'] },
        scheduledDate: { lt: startOfToday },
      },
    });

    for (const op of lateOps) {
      const existingUnread = await prisma.notification.findFirst({
        where: {
          type: 'LATE_OPERATION',
          operationId: op.id,
          readAt: null,
        },
      });

      if (!existingUnread) {
        const notification = await prisma.notification.create({
          data: {
            type: 'LATE_OPERATION',
            title: `Late Operation: ${op.reference}`,
            message: `${op.type} operation ${op.reference} was scheduled for ${new Date(op.scheduledDate).toLocaleDateString()} and is overdue.`,
            link: `/operations/${op.type.toLowerCase()}s?late=true`,
            operationId: op.id,
          },
        });
        eventBus.emit('notification.created', notification);
      }
    }
  } catch (err) {
    console.error('Error running checkLateOperations job:', err);
  }
}

export function startBackgroundJobs() {
  const timers = [];

  const handleStockChange = ({ productIds }) => {
    if (productIds && productIds.length) {
      checkProductStockStatus(productIds);
    }
  };

  eventBus.on('stock.changed', handleStockChange);

  // Run initial checks
  checkProductStockStatus();
  checkLateOperations();

  // Periodic checks every 5 minutes
  const stockInterval = setInterval(() => checkProductStockStatus(), 5 * 60 * 1000);
  const lateInterval = setInterval(() => checkLateOperations(), 5 * 60 * 1000);

  timers.push(stockInterval, lateInterval);

  return () => {
    eventBus.removeListener('stock.changed', handleStockChange);
    timers.forEach(clearInterval);
  };
}
