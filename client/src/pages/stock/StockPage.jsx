import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { ViewToggle } from '../../components/ui/ViewToggle.jsx';
import { Download, SlidersHorizontal, Edit3, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';

import { listStockApi, exportStockApi } from '../../api/stock.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listLocationsApi } from '../../api/locations.js';
import { listCategoriesApi } from '../../api/categories.js';
import { createAdjustmentApi, getAdjustmentOnHandApi } from '../../api/adjustments.js';

export function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [stockRows, setStockRows] = useState([]);
  const [totals, setTotals] = useState({ totalOnHand: 0, totalFreeToUse: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});

  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const warehouseId = searchParams.get('warehouseId') || '';
  const locationId = searchParams.get('locationId') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const groupBy = searchParams.get('groupBy') || 'product';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Update Stock Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [systemBalance, setSystemBalance] = useState(0);
  const [countedQty, setCountedQty] = useState('0');
  const [reason, setReason] = useState('COUNT_CORRECTION');
  const [notes, setNotes] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [fetchingOnHand, setFetchingOnHand] = useState(false);

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next);
  };

  const fetchMasterData = async () => {
    try {
      const [whRes, locRes, catRes] = await Promise.all([
        listWarehousesApi({ limit: 100 }),
        listLocationsApi({ type: 'INTERNAL', limit: 100 }),
        listCategoriesApi({ limit: 100 }),
      ]);
      setWarehouses(whRes.data || []);
      setLocations(locRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await listStockApi({
        search,
        warehouseId,
        locationId,
        categoryId,
        groupBy,
        page,
        limit: 25,
      });
      setStockRows(res.data || []);
      setTotals(res.totals || { totalOnHand: 0, totalFreeToUse: 0, totalValue: 0 });
      setMeta(res.meta || {});
    } catch (err) {
      toast.error(err.message || 'Failed to load stock balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchStock();
  }, [search, warehouseId, locationId, categoryId, groupBy, page]);

  // Open Adjust Modal
  const handleOpenAdjust = async (row) => {
    setTargetRow(row);
    const locId = row.locationId || locations[0]?.id || '';
    setSelectedLocationId(locId);
    setCountedQty(String(row.onHand || 0));
    setReason('COUNT_CORRECTION');
    setNotes('');
    setAdjustModalOpen(true);

    if (locId && row.productId) {
      setFetchingOnHand(true);
      try {
        const res = await getAdjustmentOnHandApi(locId, row.productId);
        setSystemBalance(res.data?.onHand ?? row.onHand ?? 0);
      } catch {
        setSystemBalance(row.onHand ?? 0);
      } finally {
        setFetchingOnHand(false);
      }
    } else {
      setSystemBalance(row.onHand ?? 0);
    }
  };

  const handleLocationChange = async (newLocId) => {
    setSelectedLocationId(newLocId);
    if (newLocId && targetRow?.productId) {
      setFetchingOnHand(true);
      try {
        const res = await getAdjustmentOnHandApi(newLocId, targetRow.productId);
        setSystemBalance(res.data?.onHand ?? 0);
        setCountedQty(String(res.data?.onHand ?? 0));
      } catch {
        setSystemBalance(0);
      } finally {
        setFetchingOnHand(false);
      }
    }
  };

  const diff = (parseFloat(countedQty || '0') - systemBalance);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocationId) {
      toast.error('Please select a target location');
      return;
    }
    setAdjustSubmitting(true);
    try {
      await createAdjustmentApi({
        locationId: selectedLocationId,
        reason,
        notes: notes || 'Stock Page Adjustment',
        lines: [
          {
            productId: targetRow.productId,
            countedQuantity: parseFloat(countedQty || '0'),
          },
        ],
      });
      toast.success('Inventory adjustment recorded!');
      setAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.product.name}</div>
          <div className="text-[11px] text-zinc-500">{row.product.categoryName || 'Uncategorized'}</div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">{row.sku}</span>,
    },
    ...(groupBy === 'location' || locationId
      ? [
          {
            key: 'location',
            label: 'Location',
            render: (row) => (
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {row.locationFullName}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'unitCost',
      label: 'Unit Cost (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-mono">₹{row.unitCost.toFixed(2)}</span>,
    },
    {
      key: 'onHand',
      label: 'On Hand',
      align: 'right',
      render: (row) => <span className="font-mono font-medium text-xs text-zinc-900 dark:text-zinc-100">{row.onHand} {row.uom}</span>,
    },
    {
      key: 'freeToUse',
      label: 'Free to Use',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
          {row.freeToUse} {row.uom}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Stock Value (₹)',
      align: 'right',
      render: (row) => <span className="font-mono text-xs font-medium">₹{row.value.toFixed(2)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => handleOpenAdjust(row)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Balances"
        subtitle="Real-time physical inventory, availability, and stock valuation per product/location."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Stock' }]}
        action={
          <a href={exportStockApi()} download="stock_report.csv">
            <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
              Export CSV
            </Button>
          </a>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Units On Hand" value={totals.totalOnHand.toLocaleString()} />
        <StatCard title="Total Free to Use" value={totals.totalFreeToUse.toLocaleString()} />
        <StatCard title="Total Stock Value" value={`₹${totals.totalValue.toLocaleString()}`} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={(val) => updateFilters({ search: val, page: '1' })}
            placeholder="Search product name or SKU..."
          />

          <Select
            value={warehouseId}
            onChange={(e) => updateFilters({ warehouseId: e.target.value, locationId: '', page: '1' })}
            options={[{ value: '', label: 'All Warehouses' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
          />

          <Select
            value={locationId}
            onChange={(e) => updateFilters({ locationId: e.target.value, page: '1' })}
            options={[{ value: '', label: 'All Locations' }, ...locations.map((l) => ({ value: l.id, label: `${l.warehouse?.shortCode || ''}/${l.shortCode}` }))]}
          />

          <Select
            value={categoryId}
            onChange={(e) => updateFilters({ categoryId: e.target.value, page: '1' })}
            options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>

        <ViewToggle
          view={groupBy}
          onChange={(v) => updateFilters({ groupBy: v, page: '1' })}
          options={[
            { id: 'product', label: 'By Product' },
            { id: 'location', label: 'By Location' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={stockRows}
        loading={loading}
        pagination={meta}
        onPageChange={(p) => updateFilters({ page: String(p) })}
        emptyTitle="No stock records found"
        emptyDescription="Adjust filter criteria or create initial stock movements to populate balances."
        emptyIcon={<BarChart3 className="w-8 h-8 text-teal-600" />}
      />

      {/* Update Stock / Adjustment Modal */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock — ${targetRow?.product?.name || ''}`}
        description={`Record physical cycle count adjustment for SKU: ${targetRow?.sku || ''}`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-2">
          <FormField label="Target Internal Location" required>
            <Select
              value={selectedLocationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              options={locations.map((l) => ({ value: l.id, label: `${l.warehouse?.shortCode || ''}/${l.shortCode} — ${l.name}` }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div>
              <div className="text-xs text-zinc-500">Current System On Hand</div>
              <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {fetchingOnHand ? '...' : systemBalance} {targetRow?.uom}
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Live Difference</div>
              <div className={`text-lg font-bold font-mono flex items-center gap-1 ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                {diff > 0 ? <ArrowUpRight className="w-4 h-4" /> : diff < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
                {diff > 0 ? `+${diff}` : diff} {targetRow?.uom}
              </div>
            </div>
          </div>

          <FormField label="Counted Quantity" required>
            <Input
              type="number"
              step="any"
              min="0"
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
              placeholder="Enter physically counted quantity..."
            />
          </FormField>

          <FormField label="Adjustment Reason" required>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[
                { value: 'COUNT_CORRECTION', label: 'Cycle Count Correction' },
                { value: 'PHYSICAL_INSPECTION', label: 'Physical Audit Inspection' },
                { value: 'DAMAGED_GOODS', label: 'Damaged / Expired Goods' },
                { value: 'FOUND_STOCK', label: 'Found Unrecorded Stock' },
                { value: 'OTHER', label: 'Other Reason' },
              ]}
            />
          </FormField>

          <FormField label="Notes / Reference">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for audit log..."
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={adjustSubmitting}>
              Submit Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
