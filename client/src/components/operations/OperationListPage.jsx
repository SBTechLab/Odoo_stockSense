import { useNavigate } from 'react-router';
import { listOperationsApi } from '../../api/operations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useSSE } from '../../hooks/useSSE.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Button } from '../ui/Button.jsx';
import { SearchInput } from '../ui/SearchInput.jsx';
import { Select } from '../ui/Select.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { DirectionBadge } from '../ui/DirectionBadge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Pagination } from '../ui/Pagination.jsx';
import { KanbanBoard } from '../ui/KanbanBoard.jsx';
import { ViewToggle } from '../ui/ViewToggle.jsx';
import { FilterChips } from '../ui/FilterChips.jsx';
import { Card } from '../ui/Card.jsx';
import { Plus, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const TYPE_CONFIG = {
  RECEIPT: {
    title: 'Incoming Receipts',
    subtitle: 'Receive products from suppliers into warehouse stock.',
    newLabel: 'New Receipt',
    emptyTitle: 'No receipts found',
    emptyDesc: 'Create a receipt to record incoming goods from a vendor.',
    icon: null,
  },
  DELIVERY: {
    title: 'Delivery Orders',
    subtitle: 'Dispatch products to customers from warehouse stock.',
    newLabel: 'New Delivery',
    emptyTitle: 'No delivery orders found',
    emptyDesc: 'Create a delivery order to dispatch goods to a customer.',
    icon: null,
  },
  INTERNAL: {
    title: 'Internal Transfers',
    subtitle: 'Move stock between internal warehouse locations.',
    newLabel: 'New Transfer',
    emptyTitle: 'No transfers found',
    emptyDesc: 'Create an internal transfer to relocate stock between locations.',
    icon: null,
  },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'READY', label: 'Ready' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELED', label: 'Canceled' },
];

const KANBAN_COLUMNS = [
  { id: 'DRAFT', title: 'Draft' },
  { id: 'WAITING', title: 'Waiting' },
  { id: 'READY', title: 'Ready' },
  { id: 'DONE', title: 'Done' },
  { id: 'CANCELED', title: 'Canceled' },
];

const ROUTE_MAP = {
  RECEIPT: '/operations/receipts',
  DELIVERY: '/operations/deliveries',
  INTERNAL: '/operations/transfers',
};

export function OperationListPage({ type }) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[type];
  const baseRoute = ROUTE_MAP[type];

  const { getParam, setParam, setParams, removeParam } = useQueryParams();
  const search = getParam('search');
  const status = getParam('status');
  const warehouseId = getParam('warehouseId');
  const late = getParam('late');
  const view = getParam('view', 'list');
  const page = parseInt(getParam('page', '1'), 10);

  const debouncedSearch = useDebounce(search, 300);

  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);

  const { data, meta: fetchedMeta, loading, error, refetch } = useFetch(
    () =>
      listOperationsApi({
        type,
        status: status || undefined,
        warehouseId: warehouseId || undefined,
        search: debouncedSearch || undefined,
        late: late || undefined,
        page,
        limit: 25,
      }),
    [type, status, warehouseId, debouncedSearch, late, page]
  );

  const operations = Array.isArray(data) ? data : [];
  const meta = fetchedMeta || { totalPages: 1, page: 1, total: operations.length, limit: 25 };

  useSSE('operation.changed', (evt) => {
    if (!evt.type || evt.type === type) refetch();
  });

  const activeFilters = [
    status && { key: 'status', label: 'Status', value: status },
    warehouseId && { key: 'warehouseId', label: 'Warehouse', value: warehouses.find((w) => w.id === warehouseId)?.shortCode || warehouseId },
    late === 'true' && { key: 'late', label: 'Filter', value: 'Late only' },
  ].filter(Boolean);

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
          {row.reference}
        </span>
      ),
    },
    {
      key: 'sourceName',
      header: 'From',
      render: (row) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{row.sourceName || '—'}</span>,
    },
    {
      key: 'destName',
      header: 'To',
      render: (row) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{row.destName || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300">{row.contact?.name || '—'}</span>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled',
      render: (row) => (
        <span className={clsx('font-mono text-xs', row.isLate ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-zinc-500')}>
          {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '—'}
          {row.isLate && <AlertTriangle className="inline w-3 h-3 ml-1" />}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const renderKanbanCard = (op) => (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-2xs space-y-2"
      onClick={() => navigate(`${baseRoute}/${op.id}`)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{op.reference}</span>
        {op.isLate && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5" /> Late
          </span>
        )}
      </div>
      {op.contact && <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{op.contact.name}</div>}
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>{op.scheduledDate ? new Date(op.scheduledDate).toLocaleDateString() : '—'}</span>
        <span>{op.lineCount} {op.lineCount === 1 ? 'line' : 'lines'}</span>
      </div>
    </div>
  );

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Operations' },
    { label: config.title },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="primary" onClick={() => navigate(`${baseRoute}/new`)} icon={<Plus className="w-4 h-4" />}>
            {config.newLabel}
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={(val) => setParams({ search: val || undefined, page: undefined })}
              placeholder="Search reference or contact..."
            />
          </div>
          <div className="w-full sm:w-40">
            <Select value={status} onChange={(e) => setParams({ status: e.target.value || undefined, page: undefined })}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={warehouseId} onChange={(e) => setParams({ warehouseId: e.target.value || undefined, page: undefined })}>
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.shortCode})</option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setParam('late', late === 'true' ? undefined : 'true')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer',
              late === 'true'
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Late only
          </button>
          <ViewToggle view={view} onChange={(v) => setParam('view', v)} />
        </div>
        <FilterChips
          filters={activeFilters}
          onRemove={(key) => removeParam(key)}
          onClearAll={() => setParams({ status: undefined, warehouseId: undefined, late: undefined, search: undefined })}
        />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState title={`Failed to load ${config.title.toLowerCase()}`} message={error.message} onRetry={refetch} />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={KANBAN_COLUMNS}
          items={operations}
          getItemColumnId={(op) => op.status}
          renderCard={renderKanbanCard}
          onCardClick={(op) => navigate(`${baseRoute}/${op.id}`)}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={operations}
            loading={loading}
            onRowClick={(row) => navigate(`${baseRoute}/${row.id}`)}
            emptyState={
              <EmptyState
                title={config.emptyTitle}
                description={config.emptyDesc}
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate(`${baseRoute}/new`)} icon={<Plus className="w-3.5 h-3.5" />}>
                    {config.newLabel}
                  </Button>
                }
              />
            }
          />
          {meta.totalPages > 1 && (
            <div className="flex justify-end">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                onPageChange={(p) => setParam('page', p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
