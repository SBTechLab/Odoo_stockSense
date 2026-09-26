import { useMemo } from 'react';
import { Combobox } from '../ui/Combobox.jsx';
import { Button } from '../ui/Button.jsx';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

/**
 * LinesEditor — editable product lines table for operation forms.
 *
 * @param {{ lines, products, onChange, readOnly, showAvailability, errors }}
 */
export function LinesEditor({ lines = [], products = [], onChange, readOnly = false, showAvailability = false, errors = [] }) {
  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.sku} — ${p.name}`,
        description: `UoM: ${p.uom || 'Units'}`,
        sku: p.sku,
        uom: p.uom || 'Units',
      })),
    [products]
  );

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const shortLines = lines.filter((l) => l.availability?.shortBy > 0);

  const handleAdd = () => {
    const usedIds = new Set(lines.map((l) => l.productId));
    const first = products.find((p) => !usedIds.has(p.id));
    onChange([...lines, { productId: first?.id || '', quantity: 1, _key: Date.now() }]);
  };

  const handleRemove = (idx) => onChange(lines.filter((_, i) => i !== idx));

  const handleChange = (idx, field, value) => {
    onChange(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // Barcode: if user types a full SKU and presses Enter, add that product
  const handleProductKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      const sku = e.target.value?.trim().toUpperCase();
      const found = products.find((p) => p.sku === sku);
      if (found) {
        e.preventDefault();
        handleChange(idx, 'productId', found.id);
      }
    }
  };

  return (
    <div className="space-y-3">
      {shortLines.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Insufficient stock for: </span>
            {shortLines.map((l) => {
              const p = productMap.get(l.productId);
              return (
                <span key={l.productId} className="mr-2">
                  {p?.name || l.productId} (short by {l.availability.shortBy} {p?.uom || 'units'})
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="py-2.5 px-3 min-w-[220px]">Product</th>
              <th className="py-2.5 px-3 w-28 text-right">Quantity</th>
              <th className="py-2.5 px-3 w-20">UoM</th>
              {showAvailability && <th className="py-2.5 px-3 w-28 text-right">Available</th>}
              {showAvailability && <th className="py-2.5 px-3 w-24 text-right">Short By</th>}
              {!readOnly && <th className="py-2.5 px-3 w-12 text-center">Del</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? (showAvailability ? 5 : 3) : (showAvailability ? 6 : 4)} className="py-8 text-center text-zinc-400 italic">
                  {readOnly ? 'No product lines.' : 'No lines added. Click "+ Add Line" to begin.'}
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => {
                const prod = productMap.get(line.productId);
                const isShort = line.availability?.shortBy > 0;
                const lineError = errors[idx];

                return (
                  <tr
                    key={line.id || line._key || idx}
                    className={clsx(
                      'transition-colors',
                      isShort ? 'bg-rose-50/60 dark:bg-rose-950/20' : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                    )}
                  >
                    <td className="py-2 px-3">
                      {readOnly ? (
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{prod?.name || '—'}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{prod?.sku || '—'}</div>
                        </div>
                      ) : (
                        <div>
                          <Combobox
                            options={productOptions}
                            value={line.productId}
                            onChange={(val) => handleChange(idx, 'productId', val)}
                            placeholder="Search product or scan SKU..."
                            onKeyDown={(e) => handleProductKeyDown(e, idx)}
                          />
                          {lineError?.productId && (
                            <p className="text-rose-600 text-[11px] mt-0.5">{lineError.productId}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {readOnly ? (
                        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{Number(line.quantity)}</span>
                      ) : (
                        <div>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={line.quantity ?? ''}
                            onChange={(e) => handleChange(idx, 'quantity', parseFloat(e.target.value) || '')}
                            className={clsx(
                              'w-24 text-right px-2.5 py-1.5 font-mono text-xs rounded-md border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600',
                              lineError?.quantity
                                ? 'border-rose-400 dark:border-rose-600'
                                : 'border-zinc-200 dark:border-zinc-800'
                            )}
                          />
                          {lineError?.quantity && (
                            <p className="text-rose-600 text-[11px] mt-0.5">{lineError.quantity}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        {prod?.uom || 'Units'}
                      </span>
                    </td>
                    {showAvailability && (
                      <td className="py-2 px-3 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {line.availability != null ? line.availability.available : '—'}
                      </td>
                    )}
                    {showAvailability && (
                      <td className="py-2 px-3 text-right">
                        {line.availability?.shortBy > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            {line.availability.shortBy}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">OK</span>
                        )}
                      </td>
                    )}
                    {!readOnly && (
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
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

      {!readOnly && (
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd} icon={<Plus className="w-3.5 h-3.5" />}>
          Add Line
        </Button>
      )}
    </div>
  );
}
