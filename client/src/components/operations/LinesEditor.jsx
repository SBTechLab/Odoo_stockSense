import { useMemo } from 'react';
import clsx from 'clsx';
import { Combobox } from '../ui/Combobox.jsx';
import { Button } from '../ui/Button.jsx';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export function LinesEditor({
  lines = [],
  onChange,
  readOnly = false,
  isOutgoing = false,
  products = [],
  error,
}) {
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
      description: `SKU: ${p.sku} | UoM: ${p.uom || 'Units'}`,
      uom: p.uom || 'Units',
      sku: p.sku,
    }));
  }, [products]);

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const handleAddLine = () => {
    // Pick first unused product if available
    const usedIds = new Set(lines.map((l) => l.productId));
    const availableProd = products.find((p) => !usedIds.has(p.id));
    const newProductId = availableProd ? availableProd.id : '';

    onChange([
      ...lines,
      {
        productId: newProductId,
        quantity: 1,
        available: 0,
        shortBy: 0,
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    const updated = lines.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleUpdateLine = (idx, field, value) => {
    const updated = lines.map((line, i) => {
      if (i !== idx) return line;
      const updatedLine = { ...line, [field]: value };
      if (field === 'productId') {
        const p = productMap.get(value);
        if (p) {
          updatedLine.product = p;
        }
      }
      return updatedLine;
    });
    onChange(updated);
  };

  const shortLines = lines.filter((l) => Number(l.shortBy) > 0);

  return (
    <div className="space-y-3">
      {/* Shortage warning banner */}
      {isOutgoing && shortLines.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Insufficient Stock: </span>
            {shortLines.length === 1 ? (
              <span>
                1 product line cannot be fulfilled completely from the chosen source location.
              </span>
            ) : (
              <span>
                {shortLines.length} product lines cannot be fulfilled completely from the chosen source location.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto bg-white dark:bg-zinc-900 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="py-2.5 px-3 min-w-[200px]">Product / Description</th>
              <th className="py-2.5 px-3 w-32">Demand Quantity</th>
              <th className="py-2.5 px-3 w-20">UoM</th>
              {isOutgoing && (
                <>
                  <th className="py-2.5 px-3 w-28 text-right">Available</th>
                  <th className="py-2.5 px-3 w-28 text-right">Shortage</th>
                </>
              )}
              {!readOnly && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={isOutgoing ? (readOnly ? 4 : 5) : readOnly ? 3 : 4}
                  className="py-8 text-center text-zinc-400 dark:text-zinc-500 italic"
                >
                  No product lines added yet. Click &quot;Add Line&quot; to begin.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => {
                const prod = line.product || productMap.get(line.productId);
                const isShort = isOutgoing && Number(line.shortBy) > 0;

                return (
                  <tr
                    key={line.id || idx}
                    className={clsx(
                      'transition-colors',
                      isShort
                        ? 'bg-rose-50/60 dark:bg-rose-950/25 hover:bg-rose-50 dark:hover:bg-rose-950/35'
                        : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                    )}
                  >
                    {/* Product Selection */}
                    <td className="py-2 px-3">
                      {readOnly ? (
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {prod?.name || 'Unknown Product'}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">
                            {prod?.sku || '—'}
                          </div>
                        </div>
                      ) : (
                        <div className="min-w-[180px]">
                          <Combobox
                            options={productOptions}
                            value={line.productId}
                            onChange={(val) => handleUpdateLine(idx, 'productId', val)}
                            placeholder="Search product SKU or name..."
                          />
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3">
                      {readOnly ? (
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                          {line.quantity}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={line.quantity ?? ''}
                          onChange={(e) =>
                            handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1.5 font-mono text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                        />
                      )}
                    </td>

                    {/* UoM */}
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        {prod?.uom || 'Units'}
                      </span>
                    </td>

                    {/* Outgoing Availability columns */}
                    {isOutgoing && (
                      <>
                        <td className="py-2 px-3 text-right font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          {line.available !== undefined ? line.available : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-xs">
                          {isShort ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              -{line.shortBy}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">0</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Action */}
                    {!readOnly && (
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          aria-label="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

      {!readOnly && (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddLine}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Product Line
          </Button>
        </div>
      )}
    </div>
  );
}
