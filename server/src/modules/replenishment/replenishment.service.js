import { prisma } from '../../lib/prisma.js';
import { getOnHand } from '../../services/stock.service.js';
import { toNumber } from '../../lib/serialize.js';

export async function getSuggestions() {
  const rules = await prisma.reorderRule.findMany({
    where: {
      product: { isActive: true },
      warehouse: { isActive: true },
    },
    include: {
      product: { select: { id: true, name: true, sku: true, uom: true, costPrice: true } },
      warehouse: { select: { id: true, name: true, shortCode: true } },
      preferredVendor: { select: { id: true, name: true, email: true } },
    },
  });

  const suggestions = [];

  for (const rule of rules) {
    const onHand = await getOnHand(rule.productId, { warehouseId: rule.warehouseId });
    const minQty = toNumber(rule.minQty);
    const maxQty = toNumber(rule.maxQty);

    if (onHand <= minQty) {
      const suggestedQty = Math.max(0, maxQty - onHand);

      const openReceiptCount = await prisma.operation.count({
        where: {
          type: 'RECEIPT',
          warehouseId: rule.warehouseId,
          status: { in: ['DRAFT', 'WAITING', 'READY'] },
          lines: { some: { productId: rule.productId } },
        },
      });

      suggestions.push({
        id: rule.id,
        ruleId: rule.id,
        productId: rule.productId,
        product: rule.product,
        warehouseId: rule.warehouseId,
        warehouse: rule.warehouse,
        onHand,
        minQty,
        maxQty,
        suggestedQty,
        preferredVendor: rule.preferredVendor,
        preferredVendorId: rule.preferredVendorId,
        hasOpenReceipt: openReceiptCount > 0,
      });
    }
  }

  return suggestions;
}
