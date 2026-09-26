import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { KanbanBoard } from '../../components/ui/KanbanBoard.jsx';
import { ViewToggle } from '../../components/ui/ViewToggle.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { DirectionBadge } from '../../components/ui/DirectionBadge.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { DateInput } from '../../components/ui/DateInput.jsx';
import { Download, History, ArrowDownLeft, ArrowUpRight, Repeat, Sliders } from 'lucide-react';
import { toast } from 'sonner';

import { listMovesApi, getMovesBoardApi, exportMovesApi } from '../../api/moves.js';
import { listLocationsApi } from '../../api/locations.js';

export function MovesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [moves, setMoves] = useState([]);
  const [boardData, setBoardData] = useState({ DRAFT: [], WAITING: [], READY: [], DONE: [], CANCELED: [] });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});

  // Filters from URL
  const view = searchParams.get('view') || 'list';
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const locationId = searchParams.get('locationId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const includePending = searchParams.get('includePending') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next);
  };

  const fetchLocations = async () => {
    try {
      const res = await listLocationsApi({ limit: 100 });
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'kanban') {
        const res = await getMovesBoardApi({
          search,
          type,
          locationId,
          dateFrom,
          dateTo,
        });
        setBoardData(res.data || { DRAFT: [], WAITING: [], READY: [], DONE: [], CANCELED: [] });
      } else {
        const res = await listMovesApi({
          search,
          type,
          locationId,
          dateFrom,
          dateTo,
          includePending: includePending ? 'true' : 'false',
          page,
          limit: 25,
        });
        setMoves(res.data || []);
        setMeta(res.meta || {});
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load stock moves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchData();
  }, [view, search, type, locationId, dateFrom, dateTo, includePending, page]);

  const getRowClassName = (row) => {
    if (row.direction === 'IN') return 'bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/30';
    if (row.direction === 'OUT') return 'bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-100/50 dark:hover:bg-rose-950/30';
    if (row.direction === 'INT') return 'bg-violet-50/40 dark:bg-violet-950/10 hover:bg-violet-100/50 dark:hover:bg-violet-950/30';
    return 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/30';
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-xs text-teal-600 dark:text-teal-400">{r.reference}</span>
          {r.pending && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Pending
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (r) => <span className="text-xs text-zinc-500">{new Date(r.date).toLocaleString()}</span>,
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (r) => <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{r.contact?.name || '—'}</span>,
    },
    {
      key: 'from',
      label: 'From',
      render: (r) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{r.from}</span>,
    },
    {
      key: 'to',
      label: 'To',
      render: (r) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{r.to}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      render: (r) => (
        <div>
          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{r.product?.name}</div>
          <div className="text-[10px] font-mono text-zinc-400">SKU: {r.product?.sku}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      align: 'right',
      render: (r) => {
        const isIncoming = r.direction === 'IN';
        const isOutgoing = r.direction === 'OUT';
        const prefix = isIncoming ? '+' : isOutgoing ? '-' : '';
        const color = isIncoming ? 'text-emerald-600 dark:text-emerald-400' : isOutgoing ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100';

        return (
          <span className={`font-mono text-xs font-bold ${color}`}>
            {prefix}{r.quantity} {r.product?.uom}
          </span>
        );
      },
    },
    {
      key: 'direction',
      label: 'Direction',
      align: 'center',
      render: (r) => <DirectionBadge type={r.direction} />,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (r) => <StatusBadge status={r.operationStatus} />,
    },
  ];

  const kanbanColumns = [
    { id: 'DRAFT', title: 'Draft' },
    { id: 'WAITING', title: 'Waiting' },
    { id: 'READY', title: 'Ready' },
    { id: 'DONE', title: 'Done (Executed)' },
    { id: 'CANCELED', title: 'Canceled' },
  ];

  const kanbanItems = Object.entries(boardData).flatMap(([st, items]) =>
    items.map((item) => ({ ...item, kanbanStatus: st }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Move History"
        subtitle="Double-entry immutable stock ledger tracking all inbound, outbound, internal, and adjustment transactions."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Move History' }]}
        action={
          <div className="flex items-center gap-2">
            <a href={exportMovesApi()} download="moves_ledger.csv">
              <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
            </a>
          </div>
        }
      />

      {/* Movement Color Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium">
        <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Move Legend:</span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50">
          <ArrowDownLeft className="w-3.5 h-3.5" /> Incoming (+Qty)
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/50">
          <ArrowUpRight className="w-3.5 h-3.5" /> Outgoing (-Qty)
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/50">
          <Repeat className="w-3.5 h-3.5" /> Internal Transfer
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50">
          <Sliders className="w-3.5 h-3.5" /> Inventory Adjustment
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={(val) => updateFilters({ search: val, page: '1' })}
            placeholder="Search reference or contact..."
          />

          <Select
            value={type}
            onChange={(e) => updateFilters({ type: e.target.value, page: '1' })}
            options={[
              { value: '', label: 'All Operation Types' },
              { value: 'RECEIPT', label: 'Receipts (IN)' },
              { value: 'DELIVERY', label: 'Deliveries (OUT)' },
              { value: 'INTERNAL', label: 'Transfers (INT)' },
              { value: 'ADJUSTMENT', label: 'Adjustments (ADJ)' },
            ]}
          />

          <Select
            value={locationId}
            onChange={(e) => updateFilters({ locationId: e.target.value, page: '1' })}
            options={[{ value: '', label: 'All Locations' }, ...locations.map((l) => ({ value: l.id, label: `${l.warehouse?.shortCode || ''}/${l.shortCode}` }))]}
          />

          <div className="flex items-center gap-2">
            <DateInput value={dateFrom} onChange={(e) => updateFilters({ dateFrom: e.target.value, page: '1' })} placeholder="From Date" className="text-xs" />
            <DateInput value={dateTo} onChange={(e) => updateFilters({ dateTo: e.target.value, page: '1' })} placeholder="To Date" className="text-xs" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {view === 'list' && (
            <Checkbox
              id="includePending"
              checked={includePending}
              onChange={(e) => updateFilters({ includePending: e.target.checked ? 'true' : '' })}
              label="Include pending"
            />
          )}

          <ViewToggle
            view={view}
            onChange={(v) => updateFilters({ view: v })}
            options={[
              { id: 'list', label: 'List View' },
              { id: 'kanban', label: 'Kanban Board' },
            ]}
          />
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          items={kanbanItems}
          getItemColumnId={(item) => item.kanbanStatus}
          renderCard={(item) => (
            <div
              className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs space-y-2 cursor-pointer hover:border-teal-500 transition-colors"
              onClick={() => item.operationId && navigate(`/operations/${item.operationId}`)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{item.reference}</span>
                <DirectionBadge type={item.direction} />
              </div>
              <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.product?.name}</div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>{item.contact?.name || 'Internal'}</span>
                <span className="font-mono font-semibold">{item.quantity} {item.product?.uom}</span>
              </div>
            </div>
          )}
        />
      ) : (
        <DataTable
          columns={columns}
          data={moves}
          loading={loading}
          rowClassName={getRowClassName}
          onRowClick={(row) => row.operationId && navigate(`/operations/${row.operationId}`)}
          pagination={meta}
          onPageChange={(p) => updateFilters({ page: String(p) })}
          emptyTitle="No stock moves recorded"
          emptyDescription="Validate receipts, deliveries, or adjustments to build the immutable stock ledger."
          emptyIcon={<History className="w-8 h-8 text-teal-600" />}
        />
      )}
    </div>
  );
}
