import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Boxes, Gauge, AlertTriangle, IndianRupee, Star, Package, Settings2, ExternalLink } from 'lucide-react';
import { listWarehousesApi, getWarehouseMapApi } from '../../api/warehouses.js';
import { getLocationStockApi, updateLocationApi } from '../../api/locations.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useSSE } from '../../hooks/useSSE.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Drawer } from '../../components/ui/Drawer.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { formatCurrency, formatNumber } from '../../utils/format.js';

/** Colour language for utilization (matches the server bands: warn ≥70 %, critical ≥90 %). */
const STATUS_STYLE = {
  OK: {
    label: 'Healthy',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    ring: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    tint: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  },
  WARNING: {
    label: 'Filling up',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    ring: 'hover:border-amber-400 dark:hover:border-amber-600',
    tint: 'bg-amber-50/60 dark:bg-amber-950/20',
  },
  CRITICAL: {
    label: 'Almost full',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    ring: 'hover:border-rose-400 dark:hover:border-rose-600',
    tint: 'bg-rose-50/60 dark:bg-rose-950/20',
  },
  UNKNOWN: {
    label: 'No capacity set',
    dot: 'bg-zinc-400',
    bar: 'bg-zinc-300 dark:bg-zinc-600',
    text: 'text-zinc-500 dark:text-zinc-400',
    ring: 'hover:border-zinc-400 dark:hover:border-zinc-500',
    tint: 'bg-zinc-50 dark:bg-zinc-900',
  },
};

function UtilizationBar({ value, status, className }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      className={clsx('h-2 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      aria-label="Capacity used"
    >
      <div className={clsx('h-full rounded-full transition-all duration-500', STATUS_STYLE[status].bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** One rack / room tile on the floor plan. */
function LocationTile({ loc, onOpen }) {
  const s = STATUS_STYLE[loc.status];
  const noCap = loc.status === 'UNKNOWN';
  return (
    <button
      type="button"
      onClick={() => onOpen(loc)}
      aria-label={`${loc.name}: ${noCap ? 'no capacity set' : `${loc.utilization}% full`}, ${loc.productCount} products. Open details`}
      className={clsx(
        'group relative flex flex-col text-left rounded-xl border p-4 min-h-[150px] transition-all cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
        'hover:-translate-y-0.5 hover:shadow-md',
        noCap ? 'border-dashed border-zinc-300 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-800',
        s.tint,
        s.ring
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={clsx('w-2.5 h-2.5 rounded-full shrink-0', s.dot)} aria-hidden="true" />
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{loc.name}</span>
          </div>
          <span className="block mt-0.5 font-mono text-[11px] text-zinc-500">{loc.fullName}</span>
        </div>
        {loc.isDefault && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded">
            <Star className="w-2.5 h-2.5" aria-hidden="true" /> Default
          </span>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className={clsx('font-mono text-2xl font-bold tabular-nums', s.text)}>
            {noCap ? '—' : `${formatNumber(loc.utilization, loc.utilization % 1 ? 1 : 0)}%`}
          </span>
          <span className={clsx('text-[11px] font-medium', s.text)}>{s.label}</span>
        </div>
        <UtilizationBar value={loc.utilization} status={loc.status} />
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-mono tabular-nums">
            {formatNumber(loc.totalQty, 1)}
            {loc.capacity ? ` / ${formatNumber(loc.capacity)}` : ''} units
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="w-3 h-3" aria-hidden="true" />
            {loc.productCount}
          </span>
        </div>
      </div>
    </button>
  );
}

function Legend({ bands }) {
  const items = [
    ['OK', `< ${bands.warn}%`],
    ['WARNING', `${bands.warn}–${bands.critical - 1}%`],
    ['CRITICAL', `≥ ${bands.critical}%`],
    ['UNKNOWN', 'no capacity'],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
      {items.map(([status, range]) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span className={clsx('w-2.5 h-2.5 rounded-full', STATUS_STYLE[status].dot)} aria-hidden="true" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{STATUS_STYLE[status].label}</span>
          <span className="font-mono text-zinc-500">{range}</span>
        </span>
      ))}
    </div>
  );
}

/** Drawer body: products stored in the selected location + capacity editor for managers. */
function LocationDetail({ locationId, canEdit, onCapacitySaved }) {
  const { data, loading, error, refetch } = useFetch(() => getLocationStockApi(locationId), [locationId]);
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCapacity(data?.capacity ? String(data.capacity) : '');
  }, [data?.capacity]);

  useSSE('stock.changed', (evt) => {
    if (!evt?.locationIds || evt.locationIds.includes(locationId)) refetch();
  });

  const saveCapacity = async (e) => {
    e.preventDefault();
    const value = capacity === '' ? null : Number(capacity);
    if (value !== null && !(value > 0)) {
      toast.error('Capacity must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      await updateLocationApi(locationId, { capacity: value });
      toast.success(value ? `Capacity set to ${formatNumber(value)} units` : 'Capacity cleared');
      await refetch();
      onCapacitySaved();
    } catch (err) {
      toast.error(err.message || 'Failed to update capacity');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error) return <ErrorState title="Could not load this location" message={error.message} onRetry={refetch} />;
  if (!data) return null;

  const status =
    data.utilization === null ? 'UNKNOWN' : data.utilization >= 90 ? 'CRITICAL' : data.utilization >= 70 ? 'WARNING' : 'OK';

  return (
    <div className="space-y-5">
      {/* Utilization summary */}
      <div className={clsx('rounded-xl border border-zinc-200 dark:border-zinc-800 p-4', STATUS_STYLE[status].tint)}>
        <div className="flex items-baseline justify-between mb-2">
          <span className={clsx('font-mono text-3xl font-bold tabular-nums', STATUS_STYLE[status].text)}>
            {data.utilization === null ? '—' : `${data.utilization}%`}
          </span>
          <span className={clsx('text-xs font-semibold', STATUS_STYLE[status].text)}>{STATUS_STYLE[status].label}</span>
        </div>
        <UtilizationBar value={data.utilization} status={status} />
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['On hand', `${formatNumber(data.totalQty, 1)}`],
            ['Capacity', data.capacity ? formatNumber(data.capacity) : '—'],
            ['Value', formatCurrency(data.totalValue)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/70 dark:bg-zinc-900/70 py-2">
              <dt className="text-[10px] uppercase tracking-wide text-zinc-500">{k}</dt>
              <dd className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate px-1">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Capacity editor (Admin / Manager) */}
      {canEdit && (
        <form onSubmit={saveCapacity} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="loc-capacity" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Capacity (units)
            </label>
            <Input
              id="loc-capacity"
              type="number"
              min="0"
              step="any"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" loading={saving} icon={<Settings2 className="w-3.5 h-3.5" />}>
            Save
          </Button>
        </form>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Products <span className="text-zinc-500 font-normal">({data.items.length})</span>
          </h3>
          <Link
            to={`/stock?locationId=${locationId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
          >
            Open in Stock <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {data.items.length === 0 ? (
          <EmptyState icon={<Boxes className="w-6 h-6" />} title="This location is empty" description="Receive or transfer stock here to see it on the map." />
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            {data.items.map((item) => {
              const share = data.totalQty ? (item.onHand / data.totalQty) * 100 : 0;
              return (
                <li key={item.productId}>
                  <Link
                    to={`/products/${item.productId}`}
                    className="block px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                        <div className="font-mono text-[11px] text-zinc-500">
                          {item.sku}
                          {item.category ? ` · ${item.category}` : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatNumber(item.onHand, item.onHand % 1 ? 2 : 0)} <span className="text-[11px] font-normal text-zinc-500">{item.uom}</span>
                        </div>
                        {item.reserved > 0 && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400">
                            {formatNumber(item.reserved, 1)} reserved · {formatNumber(item.freeToUse, 1)} free
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden" aria-hidden="true">
                      <div className="h-full bg-teal-500/70" style={{ width: `${share}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function WarehouseMapPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const { getParam, setParam } = useQueryParams();
  const [selected, setSelected] = useState(null);

  const { data: warehouses = [], loading: whLoading, error: whError, refetch: refetchWh } = useFetch(listWarehousesApi, []);
  const warehouseId = getParam('warehouseId') || warehouses[0]?.id || '';

  const { data: mapData, loading, error, refetch } = useFetch(
    () => (warehouseId ? getWarehouseMapApi(warehouseId) : Promise.resolve(undefined)),
    [warehouseId]
  );
  // Only treat a complete map payload as loaded (guards against any stale/empty response).
  const map = mapData?.summary && mapData?.locations ? mapData : undefined;

  // Live: re-read utilization whenever stock moves anywhere.
  useSSE('stock.changed', () => refetch());

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Warehouse Map' }];

  if (whError) {
    return <ErrorState title="Failed to load warehouses" message={whError.message} onRetry={refetchWh} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouse Map"
        subtitle="See how full every rack, room and floor is at a glance. Click a location to see what is stored there."
        breadcrumbs={breadcrumbs}
      />

      {/* Warehouse switcher */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose warehouse">
        {whLoading && !warehouses.length
          ? [0, 1].map((i) => <Skeleton key={i} className="h-9 w-40 rounded-lg" />)
          : warehouses.map((w) => {
              const active = w.id === warehouseId;
              return (
                <button
                  key={w.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setParam('warehouseId', w.id)}
                  className={clsx(
                    'px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer min-h-[40px]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
                    active
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                  )}
                >
                  {w.name} <span className={clsx('font-mono text-xs', active ? 'text-teal-100' : 'text-zinc-500')}>({w.shortCode})</span>
                </button>
              );
            })}
      </div>

      {error ? (
        <ErrorState title="Failed to load the warehouse map" message={error.message} onRetry={refetch} />
      ) : !map && (loading || whLoading) ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : !map ? (
        <EmptyState
          icon={<Boxes className="w-6 h-6" />}
          title="No warehouses yet"
          description="Create a warehouse and its locations to see them on the map."
          action={
            <Link to="/settings/warehouses">
              <Button variant="primary" size="sm">Go to Warehouses</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Overall Utilization"
              value={map.summary.overallUtilization === null ? '—' : `${map.summary.overallUtilization}%`}
              subtitle="of configured capacity"
              icon={<Gauge className="w-5 h-5 text-teal-600" />}
            />
            <StatCard
              title="Locations"
              value={map.summary.locationCount}
              subtitle={`${formatNumber(map.summary.totalQty, 1)} units stored`}
              icon={<Boxes className="w-5 h-5 text-sky-600" />}
            />
            <StatCard
              title="Need Attention"
              value={map.summary.critical + map.summary.warning}
              subtitle={`${map.summary.critical} almost full · ${map.summary.warning} filling up`}
              icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            />
            <StatCard
              title="Stock Value"
              value={formatCurrency(map.summary.totalValue)}
              subtitle="in this warehouse"
              icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
            />
          </div>

          {/* Floor plan */}
          <section
            aria-label={`${map.warehouse.name} floor plan`}
            className="rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60">
              <div>
                <h2 className="text-base font-bold tracking-wide uppercase text-zinc-900 dark:text-zinc-100">
                  {map.warehouse.name} <span className="font-mono text-sm text-zinc-500">· {map.warehouse.shortCode}</span>
                </h2>
                {map.warehouse.address && <p className="text-xs text-zinc-500 mt-0.5">{map.warehouse.address}</p>}
              </div>
              <Legend bands={map.bands} />
            </div>

            {map.locations.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Boxes className="w-6 h-6" />}
                  title="No internal locations"
                  description="Add racks, rooms or floors to this warehouse to see them here."
                  action={
                    <Link to="/settings/locations">
                      <Button variant="primary" size="sm">Add Location</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div
                className="p-4 sm:p-6 grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgb(161 161 170 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(161 161 170 / 0.08) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                {map.locations.map((loc) => (
                  <LocationTile key={loc.id} loc={loc} onOpen={setSelected} />
                ))}
              </div>
            )}

            {map.locations.some((l) => l.status === 'UNKNOWN') && (
              <p className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                Dashed tiles have no capacity yet.{' '}
                {canEdit ? 'Open a tile to set one.' : 'Ask a manager to set one.'}
              </p>
            )}
          </section>
        </>
      )}

      <Drawer
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : ''}
        description={selected ? `${selected.fullName} · ${selected.productCount} products` : ''}
        size="lg"
      >
        {selected && <LocationDetail locationId={selected.id} canEdit={canEdit} onCapacitySaved={refetch} />}
      </Drawer>
    </div>
  );
}
