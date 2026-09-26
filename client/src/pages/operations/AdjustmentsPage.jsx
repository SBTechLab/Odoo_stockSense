import { useState } from 'react';
import { useNavigate } from 'react-router';
import { listAdjustmentsApi } from '../../api/adjustments.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useSSE } from '../../hooks/useSSE.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Plus, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';

const REASON_COLORS = {
  COUNT_CORRECTION: 'teal',
  DAMAGED: 'rose',
  LOST: 'amber',
  FOUND: 'emerald',
  OTHER: 'zinc',
};

export function AdjustmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);

  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch(
    () =>
      listAdjustmentsApi({
        search: debouncedSearch || undefined,
        warehouseId: warehouseId || undefined,
        page,
        limit: 20,
      }),
    [debouncedSearch, warehouseId, page]
  );

  const adjustments = data?.data || (Array.isArray(data) ? data : []);
  const meta = data?.meta || { totalPages: 1, page: 1, total: adjustments.length };

  useSSE('operation.changed', (evt) => {
    if (evt.type === 'ADJUSTMENT') refetch();
  });

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 hover:text-teal-600 dark:hover:text-teal-400">
          {row.reference}
        </span>
      ),
    },
    {
      key: 'sourceName',
      header: 'Location',
      render: (row) => (
        <span className="text-zinc-700 dark:text-zinc-300 font-medium text-xs">
          {row.sourceName || '—'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => {
        const color = REASON_COLORS[row.reason] || 'zinc';
        return <Badge color={color}>{row.reason?.replace('_', ' ') || 'OTHER'}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'lineCount',
      header: 'Items',
      render: (row) => (
        <span className="font-mono text-xs text-zinc-500">
          {row.lineCount} {row.lineCount === 1 ? 'item' : 'items'}
        </span>
      ),
    },
    {
      key: 'totalDifference',
      header: 'Net Delta',
      render: (row) => {
        const diff = Number(row.totalDifference || 0);
        return (
          <span
            className={clsx(
              'font-mono text-xs font-semibold px-2 py-0.5 rounded',
              diff > 0
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                : diff < 0
                ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300'
                : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
            )}
          >
            {diff > 0 ? `+${diff}` : diff}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge status="DONE" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustments"
        subtitle="Record cycle counts, physical inventory reconciliations, scrap write-offs, and damage adjustments."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: 'Adjustments' }]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/operations/adjustments/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            New Adjustment
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search reference, reason, notes..."
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.shortCode})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {error ? (
        <ErrorState
          title="Failed to load adjustments"
          message={error.message}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={adjustments}
            loading={loading}
            onRowClick={(row) => navigate(`/operations/adjustments/${row.id}`)}
            emptyState={
              <EmptyState
                icon={<SlidersHorizontal className="w-8 h-8 text-teal-600" />}
                title="No inventory adjustments found"
                description="Perform physical counts to reconcile system stock quantities with actual floor inventory."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/operations/adjustments/new')}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    New Adjustment
                  </Button>
                }
              />
            }
          />

          {meta.totalPages > 1 && (
            <div className="flex justify-end pt-2">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
