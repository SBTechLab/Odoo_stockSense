import { useState } from 'react';
import { listActivityApi } from '../../api/activity.js';
import { useFetch } from '../../hooks/useFetch.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { DateInput } from '../../components/ui/DateInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { formatDateTime } from '../../utils/format.js';
import { Activity as ActivityIcon, Code } from 'lucide-react';

export function ActivityPage() {
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const {
    data: logs = [],
    meta,
    loading,
  } = useFetch(
    () =>
      listActivityApi({
        entityType: entityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
      }),
    [entityFilter, dateFrom, dateTo, page, limit]
  );

  const columns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      className: 'w-44',
      render: (log) => (
        <span className="text-xs font-mono text-zinc-500">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Operator',
      className: 'w-48',
      render: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px] uppercase shrink-0">
            {log.user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
              {log.user?.name || 'System'}
            </div>
            {log.user?.loginId && (
              <div className="text-[11px] font-mono text-zinc-400">@{log.user.loginId}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      className: 'w-48',
      render: (log) => (
        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
          {log.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity Target',
      render: (log) => (
        <div className="text-xs">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{log.entityType}</span>
          {log.entityId && (
            <span className="ml-1.5 font-mono text-zinc-400 text-[11px]">({log.entityId.slice(0, 8)}...)</span>
          )}
        </div>
      ),
    },
    {
      key: 'metadata',
      header: 'Metadata',
      render: (log) => (
        <div className="max-w-md">
          {log.metadata ? (
            <pre className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 truncate">
              {JSON.stringify(log.metadata)}
            </pre>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Audit Log"
        subtitle="Immutable chronicle of all user operations and master data modifications."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }, { label: 'Activity' }]}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <Select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          >
            <option value="">All Entities</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Location">Location</option>
            <option value="User">User</option>
            <option value="Operation">Operation</option>
            <option value="Product">Product</option>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">From:</span>
            <DateInput
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">To:</span>
            <DateInput
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={logs} loading={loading} />

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
