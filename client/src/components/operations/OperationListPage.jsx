import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { listOperationsApi } from '../../api/operations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useSSE } from '../../hooks/useSSE.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { KanbanBoard } from '../ui/KanbanBoard.jsx';
import { Button } from '../ui/Button.jsx';
import { SearchInput } from '../ui/SearchInput.jsx';
import { Select } from '../ui/Select.jsx';
import { ViewToggle } from '../ui/ViewToggle.jsx';
import { StatusBadge } from '../ui/Badge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Pagination } from '../ui/Pagination.jsx';
import { Plus, Clock, AlertCircle, Inbox } from 'lucide-react';
import clsx from 'clsx';

export function OperationListPage({
  type, // 'RECEIPT' | 'DELIVERY' | 'INTERNAL'
  title, // 'Receipts' | 'Delivery Orders' | 'Internal Transfers'
  subtitle,
  baseRoute, // e.g. '/operations/receipts'
}) {
  const navigate = useNavigate();
  const { params, setParam, setParams } = useQueryParams();

  const currentSearch = params.search || '';
  const currentStatus = params.status || 'ALL';
  const currentWarehouse = params.warehouseId || '';
  const currentLate = params.late === 'true';
  const currentView = params.view === 'kanban' ? 'kanban' : 'list';
  const currentPage = parseInt(params.page || '1', 10);

  const debouncedSearch = useDebounce(currentSearch, 300);

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);

  // Construct query for API
  const queryParams = useMemo(() => {
    const q = {
      type,
      page: currentPage,
      limit: 20,
    };
    if (debouncedSearch) q.search = debouncedSearch;
    if (currentStatus && currentStatus !== 'ALL') q.status = currentStatus;
    if (currentWarehouse) q.warehouseId = currentWarehouse;
    if (currentLate) q.late = 'true';
    return q;
  }, [type, currentPage, debouncedSearch, currentStatus, currentWarehouse, currentLate]);

  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch(() => listOperationsApi(queryParams), [queryParams]);

  const operations = data?.data || (Array.isArray(data) ? data : []);
  const meta = data?.meta || { totalPages: 1, page: 1, total: operations.length };

  // Live SSE reload on mutations
  useSSE('operation.changed', (evt) => {
    if (!evt.type || evt.type === type) {
      refetch();
    }
  });

  const statusChips =
    type === 'RECEIPT'
      ? ['ALL', 'DRAFT', 'READY', 'DONE', 'CANCELED']
      : ['ALL', 'DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];

  const kanbanColumns =
    type === 'RECEIPT'
      ? [
          { id: 'DRAFT', title: 'Draft' },
          { id: 'READY', title: 'Ready' },
          { id: 'DONE', title: 'Done' },
          { id: 'CANCELED', title: 'Canceled' },
        ]
      : [
          { id: 'DRAFT', title: 'Draft' },
          { id: 'WAITING', title: 'Waiting' },
          { id: 'READY', title: 'Ready' },
          { id: 'DONE', title: 'Done' },
          { id: 'CANCELED', title: 'Canceled' },
        ];

  const columns = [
    {
      header: 'Reference',
      accessorKey: 'reference',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 hover:text-teal-600 dark:hover:text-teal-400">
          {row.reference}
        </span>
      ),
    },
    {
      header: 'From',
      accessorKey: 'sourceName',
      cell: ({ row }) => (
        <span className="text-zinc-600 dark:text-zinc-400 text-xs">
          {row.sourceName || '—'}
        </span>
      ),
    },
    {
      header: 'To',
      accessorKey: 'destName',
      cell: ({ row }) => (
        <span className="text-zinc-600 dark:text-zinc-400 text-xs">
          {row.destName || '—'}
        </span>
      ),
    },
    ...(type !== 'INTERNAL'
      ? [
          {
            header: type === 'RECEIPT' ? 'Vendor' : 'Customer',
            accessorKey: 'contact.name',
            cell: ({ row }) => (
              <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">
                {row.contact?.name || '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      header: 'Scheduled Date',
      accessorKey: 'scheduledDate',
      cell: ({ row }) => {
        const d = row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '—';
        return (
          <div
            className={clsx(
              'inline-flex items-center gap-1.5 text-xs font-mono',
              row.isLate
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400'
            )}
          >
            {row.isLate && <Clock className="w-3.5 h-3.5" />}
            <span>{d}</span>
          </div>
        );
      },
    },
    {
      header: 'Lines',
      accessorKey: 'lineCount',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-500">
          {row.lineCount} {row.lineCount === 1 ? 'item' : 'items'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: title }]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate(`${baseRoute}/new`)}
            icon={<Plus className="w-4 h-4" />}
          >
            New {type === 'RECEIPT' ? 'Receipt' : type === 'DELIVERY' ? 'Delivery' : 'Transfer'}
          </Button>
        }
      />

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full lg:w-80">
            <SearchInput
              value={currentSearch}
              onChange={(val) => setParams({ search: val, page: 1 })}
              placeholder="Search reference, contact..."
            />
          </div>

          {/* Warehouse and Late toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-44">
              <Select
                value={currentWarehouse}
                onChange={(e) => setParams({ warehouseId: e.target.value, page: 1 })}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.shortCode})
                  </option>
                ))}
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setParams({ late: currentLate ? undefined : 'true', page: 1 })}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer min-h-[36px]',
                currentLate
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 font-semibold'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-300'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Late only</span>
            </button>

            <ViewToggle
              view={currentView}
              onChange={(v) => setParam('view', v)}
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <span className="text-xs text-zinc-400 mr-1 select-none">Status:</span>
          {statusChips.map((st) => {
            const isActive = currentStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setParams({ status: st === 'ALL' ? undefined : st, page: 1 })}
                className={clsx(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                )}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: List or Kanban */}
      {error ? (
        <ErrorState
          title={`Failed to load ${title}`}
          message={error.message}
          onRetry={refetch}
        />
      ) : currentView === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          items={operations}
          getItemColumnId={(item) => item.status}
          onCardClick={(item) => navigate(`${baseRoute}/${item.id}`)}
          renderCard={(item) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  {item.reference}
                </span>
                {item.isLate && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    Late
                  </span>
                )}
              </div>
              {item.contact?.name && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                  {item.contact.name}
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
                <span>{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '—'}</span>
                <span>{item.lineCount} items</span>
              </div>
            </div>
          )}
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
                icon={<Inbox className="w-8 h-8 text-teal-600" />}
                title={`No ${title.toLowerCase()} found`}
                description="Create a new document to register and track inventory movements."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`${baseRoute}/new`)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    New Document
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
                onChange={(p) => setParam('page', p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
