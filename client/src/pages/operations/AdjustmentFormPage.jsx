import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  createAdjustmentApi,
  getAdjustmentApi,
  getAdjustmentOnHandApi,
} from '../../api/adjustments.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listLocationsApi } from '../../api/locations.js';
import { listProductsApi } from '../../api/products.js';
import { useFetch } from '../../hooks/useFetch.js';
import { Button } from '../../components/ui/Button.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Combobox } from '../../components/ui/Combobox.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { ArrowLeft, Plus, Trash2, Printer, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const round3 = (n) => Math.round(n * 1000) / 1000;

const REASON_OPTIONS = [
  { value: 'COUNT_CORRECTION', label: 'Periodic Physical Count / Audit' },
  { value: 'DAMAGED', label: 'Damaged Goods / Scrap Write-off' },
  { value: 'LOST', label: 'Lost / Missing Items' },
  { value: 'FOUND', label: 'Found Unrecorded Stock' },
  { value: 'OTHER', label: 'Other Operational Adjustment' },
];

const formSchema = z.object({
  warehouseId: z.string().min(1, 'Please select a warehouse'),
  locationId: z.string().min(1, 'Please select an internal location'),
  reason: z.enum(['COUNT_CORRECTION', 'DAMAGED', 'LOST', 'FOUND', 'OTHER']),
  notes: z.string().optional().nullable(),
});

export function AdjustmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [operation, setOperation] = useState(null);
  const [loadingOp, setLoadingOp] = useState(!isNew);
  const [lines, setLines] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // References
  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);
  const { data: products = [] } = useFetch(() => listProductsApi({ limit: 100 }), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: '',
      locationId: '',
      reason: 'COUNT_CORRECTION',
      notes: '',
    },
  });

  const selectedWarehouseId = watch('warehouseId');
  const selectedLocationId = watch('locationId');

  // Internal locations for the selected warehouse
  const { data: locations = [] } = useFetch(
    () =>
      selectedWarehouseId
        ? listLocationsApi({ warehouseId: selectedWarehouseId, type: 'INTERNAL' })
        : Promise.resolve([]),
    [selectedWarehouseId]
  );

  // Set default warehouse & location on load
  useEffect(() => {
    if (isNew && warehouses.length > 0 && !selectedWarehouseId) {
      setValue('warehouseId', warehouses[0].id);
    }
  }, [warehouses, isNew, selectedWarehouseId, setValue]);

  // Pick the warehouse's default location; re-pick when the warehouse changes
  // so a location from another warehouse is never submitted.
  useEffect(() => {
    if (!isNew || locations.length === 0) return;
    if (locations.some((l) => l.id === selectedLocationId)) return;
    const wh = warehouses.find((w) => w.id === selectedWarehouseId);
    const def = locations.find((l) => l.id === wh?.defaultLocationId);
    setValue('locationId', (def || locations[0]).id);
  }, [locations, warehouses, selectedWarehouseId, isNew, selectedLocationId, setValue]);

  // Load existing adjustment detail
  useEffect(() => {
    if (id) {
      setLoadingOp(true);
      getAdjustmentApi(id)
        .then((res) => {
          setOperation(res.data);
          setLines(res.data.lines || []);
          reset({
            warehouseId: res.data.warehouseId,
            locationId: res.data.sourceLocationId,
            reason: res.data.reason || 'COUNT_CORRECTION',
            notes: res.data.notes || '',
          });
        })
        .catch((err) => {
          toast.error(err.message || 'Failed to load adjustment');
        })
        .finally(() => setLoadingOp(false));
    }
  }, [id, reset]);

  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
      description: `SKU: ${p.sku} | UoM: ${p.uom || 'Units'}`,
      uom: p.uom || 'Units',
    }));
  }, [products]);

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Fetch real-time system quantity for a product at selected location
  const fetchOnHand = useCallback(
    async (productId) => {
      if (!selectedLocationId || !productId) return 0;
      try {
        const res = await getAdjustmentOnHandApi(selectedLocationId, productId);
        return res.data?.onHand ?? 0;
      } catch {
        return 0;
      }
    },
    [selectedLocationId]
  );

  const handleAddLine = async () => {
    const usedIds = new Set(lines.map((l) => l.productId));
    const availableProd = products.find((p) => !usedIds.has(p.id));
    const newProductId = availableProd ? availableProd.id : '';
    const sysQty = newProductId ? await fetchOnHand(newProductId) : 0;

    setLines((prev) => [
      ...prev,
      {
        productId: newProductId,
        theoreticalQuantity: sysQty,
        countedQuantity: sysQty,
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProductChange = async (idx, newProdId) => {
    const sysQty = await fetchOnHand(newProdId);
    setLines((prev) =>
      prev.map((line, i) =>
        i === idx
          ? {
              ...line,
              productId: newProdId,
              theoreticalQuantity: sysQty,
              countedQuantity: sysQty,
            }
          : line
      )
    );
  };

  const handleCountedChange = (idx, val) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === idx
          ? {
              ...line,
              countedQuantity: val,
            }
          : line
      )
    );
  };

  // Re-fetch system quantities if location changes
  useEffect(() => {
    if (isNew && selectedLocationId && lines.length > 0) {
      lines.forEach(async (line, idx) => {
        if (line.productId) {
          const sysQty = await fetchOnHand(line.productId);
          setLines((prev) =>
            prev.map((l, i) =>
              i === idx
                ? {
                    ...l,
                    theoreticalQuantity: sysQty,
                  }
                : l
            )
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  // Submit Handler
  const onSubmit = () => {
    if (lines.length === 0) {
      toast.error('Add at least one product to adjust');
      return;
    }
    const hasUnselected = lines.some((l) => !l.productId);
    if (hasUnselected) {
      toast.error('All lines must have a selected product');
      return;
    }
    const hasDiff = lines.some(
      (l) => round3(Number(l.countedQuantity) - Number(l.theoreticalQuantity || 0)) !== 0
    );
    if (!hasDiff) {
      toast.error('No difference detected: Counted quantities match system quantities');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        locationId: selectedLocationId,
        reason: watch('reason'),
        notes: watch('notes') || null,
        lines: lines.map((l) => ({
          productId: l.productId,
          countedQuantity: Number(l.countedQuantity),
        })),
      };

      const res = await createAdjustmentApi(payload);
      toast.success(`Adjustment ${res.data.reference} posted and stock updated!`);
      setShowConfirm(false);
      navigate(`/operations/adjustments/${res.data.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const nonZeroCount = lines.filter(
    (l) => round3(Number(l.countedQuantity) - Number(l.theoreticalQuantity || 0)) !== 0
  ).length;

  const totalDelta = round3(
    lines.reduce(
      (acc, l) => acc + (Number(l.countedQuantity) - Number(l.theoreticalQuantity || 0)),
      0
    )
  );

  if (loadingOp) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/operations/adjustments')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {operation?.reference || 'New Inventory Adjustment'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isNew
                ? 'Record cycle count or stock reconciliation'
                : `Validated on ${operation?.validatedAt ? new Date(operation.validatedAt).toLocaleDateString() : '—'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/operations/${id}/print`, '_blank')}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Slip
            </Button>
          )}
          <StatusBadge status={isNew ? 'DRAFT' : 'DONE'} />
        </div>
      </div>

      {/* Main Content Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          {/* Warehouse */}
          <FormField label="Warehouse" required error={errors.warehouseId?.message}>
            <Select {...register('warehouseId')} disabled={!isNew}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.shortCode})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Location */}
          <FormField label="Internal Location" required error={errors.locationId?.message}>
            <Select {...register('locationId')} disabled={!isNew}>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.shortCode})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Reason */}
          <FormField label="Adjustment Reason" required error={errors.reason?.message}>
            <Select {...register('reason')} disabled={!isNew}>
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Notes */}
          <FormField label="Notes & Justification" className="md:col-span-2 lg:col-span-3">
            <Textarea
              {...register('notes')}
              rows={2}
              disabled={!isNew}
              placeholder="Provide reason or audit ticket reference for this physical count adjustment..."
            />
          </FormField>
        </div>

        {/* Lines Table */}
        <div className="space-y-3 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Adjusted Inventory Lines
              </h2>
              <p className="text-xs text-zinc-500">
                Compare theoretical system balances against verified physical floor counts.
              </p>
            </div>
            {isNew && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddLine}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Product
              </Button>
            )}
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[200px]">Product Item</th>
                  <th className="py-2.5 px-3 w-28 text-right">System Qty</th>
                  <th className="py-2.5 px-3 w-32 text-right">Counted Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Difference</th>
                  <th className="py-2.5 px-3 w-20">UoM</th>
                  {isNew && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {lines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isNew ? 6 : 5}
                      className="py-8 text-center text-zinc-400 dark:text-zinc-500 italic"
                    >
                      No products added for adjustment. Click &quot;Add Product&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, idx) => {
                    const prod = line.product || productMap.get(line.productId);
                    const sys = Number(line.theoreticalQuantity ?? 0);
                    const counted = Number(line.countedQuantity ?? 0);
                    const diff = isNew ? round3(counted - sys) : Number(line.quantity ?? 0);

                    return (
                      <tr key={line.id || idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                        {/* Product */}
                        <td className="py-2 px-3">
                          {isNew ? (
                            <div className="min-w-[180px]">
                              <Combobox
                                options={productOptions}
                                value={line.productId}
                                onChange={(val) => handleProductChange(idx, val)}
                                placeholder="Search product..."
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {prod?.name || 'Unknown Product'}
                              </div>
                              <div className="font-mono text-[11px] text-zinc-500">
                                {prod?.sku || '—'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* System Qty */}
                        <td className="py-2 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                          {sys}
                        </td>

                        {/* Counted Qty */}
                        <td className="py-2 px-3 text-right">
                          {isNew ? (
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={line.countedQuantity ?? ''}
                              onChange={(e) =>
                                handleCountedChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-28 text-right px-2.5 py-1.5 font-mono text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                            />
                          ) : (
                            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                              {counted}
                            </span>
                          )}
                        </td>

                        {/* Difference */}
                        <td className="py-2 px-3 text-right">
                          <span
                            className={clsx(
                              'inline-block px-2 py-0.5 rounded font-mono font-semibold text-xs',
                              diff > 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : diff < 0
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'text-zinc-400'
                            )}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>

                        {/* UoM */}
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                            {prod?.uom || 'Units'}
                          </span>
                        </td>

                        {/* Action */}
                        {isNew && (
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

          {/* New Mode Submit Footer */}
          {isNew && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  Adjusting <strong>{nonZeroCount}</strong> products with discrepancies
                </span>
                <span>•</span>
                <span>
                  Net Inventory Delta:{' '}
                  <strong className={totalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {totalDelta > 0 ? `+${totalDelta}` : totalDelta}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/operations/adjustments')}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={lines.length === 0}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Apply & Post Adjustment
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        loading={submitting}
        title="Post Inventory Adjustment"
        message={`Are you sure you want to post adjustments for ${nonZeroCount} items? Physical on-hand stock will be immediately reconciled, and a permanent ledger record will be written with net delta ${totalDelta > 0 ? `+${totalDelta}` : totalDelta}.`}
        confirmText="Confirm & Post"
        variant="primary"
      />
    </div>
  );
}
