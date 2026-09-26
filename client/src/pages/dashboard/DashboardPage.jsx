import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DirectionBadge } from '../../components/ui/DirectionBadge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useSSE } from '../../hooks/useSSE.js';
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  RefreshCw,
  TrendingUp,
  BarChart2,
  ChevronRight,
  Clock,
  AlertCircle,
  Truck,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import {
  getDashboardSummaryApi,
  getDashboardOperationCardsApi,
  getDashboardTrendsApi,
  getDashboardTopProductsApi,
} from '../../api/dashboard.js';
import { listMovesApi } from '../../api/moves.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listLocationsApi } from '../../api/locations.js';
import { listCategoriesApi } from '../../api/categories.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);

  // Master Data
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Dashboard Metrics
  const [summary, setSummary] = useState(null);
  const [cards, setCards] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topData, setTopData] = useState({ topProducts: [], lowStockList: [] });
  const [recentMoves, setRecentMoves] = useState([]);

  // Filters from URL
  const warehouseId = searchParams.get('warehouseId') || '';
  const locationId = searchParams.get('locationId') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
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

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    const filterParams = { warehouseId, locationId, categoryId, type, status };
    try {
      const [sumRes, cardsRes, trendsRes, topRes, movesRes] = await Promise.all([
        getDashboardSummaryApi(filterParams),
        getDashboardOperationCardsApi(filterParams),
        getDashboardTrendsApi({ ...filterParams, days: 30 }),
        getDashboardTopProductsApi(filterParams),
        listMovesApi({ limit: 6 }),
      ]);

      setSummary(sumRes.data);
      setCards(cardsRes.data);
      setTrends(trendsRes.data || []);
      setTopData(topRes.data || { topProducts: [], lowStockList: [] });
      setRecentMoves(movesRes.data || []);
    } catch {
      if (!silent) toast.error('Failed to load dashboard metrics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, locationId, categoryId, type, status]);

  // Real-time SSE updates
  useSSE('stock.changed', () => fetchDashboardData(true));
  useSSE('operation.changed', () => fetchDashboardData(true));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Operations Dashboard"
        subtitle="Real-time KPI telemetry, operational queues, movement trends, and low-stock alerts."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        action={
          <Button variant="secondary" onClick={() => fetchDashboardData()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        }
      />

      {/* Global Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 flex-1">
          <Select
            value={warehouseId}
            onChange={(e) => updateFilters({ warehouseId: e.target.value, locationId: '' })}
            options={[{ value: '', label: 'All Warehouses' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
          />

          <Select
            value={locationId}
            onChange={(e) => updateFilters({ locationId: e.target.value })}
            options={[{ value: '', label: 'All Locations' }, ...locations.map((l) => ({ value: l.id, label: `${l.warehouse?.shortCode || ''}/${l.shortCode}` }))]}
          />

          <Select
            value={categoryId}
            onChange={(e) => updateFilters({ categoryId: e.target.value })}
            options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />

          <Select
            value={type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            options={[
              { value: '', label: 'All Document Types' },
              { value: 'RECEIPT', label: 'Receipts' },
              { value: 'DELIVERY', label: 'Deliveries' },
              { value: 'INTERNAL', label: 'Transfers' },
              { value: 'ADJUSTMENT', label: 'Adjustments' },
            ]}
          />

          <Select
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'WAITING', label: 'Waiting' },
              { value: 'READY', label: 'Ready' },
              { value: 'DONE', label: 'Done' },
              { value: 'CANCELED', label: 'Canceled' },
            ]}
          />
        </div>

        {(warehouseId || locationId || categoryId || type || status) && (
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-zinc-500">
            Reset Filters
          </Button>
        )}
      </div>

      {/* KPI Stat Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={summary?.totalProducts ?? 0}
            description={`${(summary?.totalUnitsOnHand ?? 0).toLocaleString()} units on hand`}
            icon={<Package className="w-5 h-5 text-teal-600" />}
            onClick={() => navigate('/products')}
            trend="up"
          />

          <StatCard
            title="Stock Value"
            value={`₹${(summary?.stockValue ?? 0).toLocaleString()}`}
            description="Total inventory valuation"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            onClick={() => navigate('/stock')}
          />

          <StatCard
            title="Low Stock Alert"
            value={summary?.lowStockCount ?? 0}
            description="Items below reorder point"
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            onClick={() => navigate('/products?stockStatus=LOW')}
            trend={summary?.lowStockCount > 0 ? 'down' : 'neutral'}
          />

          <StatCard
            title="Out of Stock"
            value={summary?.outOfStockCount ?? 0}
            description="Items with 0 balance"
            icon={<XCircle className="w-5 h-5 text-rose-500" />}
            onClick={() => navigate('/products?stockStatus=OUT')}
            trend={summary?.outOfStockCount > 0 ? 'down' : 'neutral'}
          />

          <StatCard
            title="Pending Receipts"
            value={summary?.pendingReceipts ?? 0}
            description="Inbound shipments to receive"
            icon={<ArrowDownLeft className="w-5 h-5 text-blue-600" />}
            onClick={() => navigate('/operations/receipts?status=READY')}
          />

          <StatCard
            title="Pending Deliveries"
            value={summary?.pendingDeliveries ?? 0}
            description="Outbound orders to ship"
            icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
            onClick={() => navigate('/operations/deliveries?status=READY')}
          />

          <StatCard
            title="Transfers Scheduled"
            value={summary?.scheduledTransfers ?? 0}
            description="Internal warehouse moves"
            icon={<Repeat className="w-5 h-5 text-violet-600" />}
            onClick={() => navigate('/operations/transfers?status=READY')}
          />
        </div>
      )}

      {/* Operation Operational Cards (Receipts & Deliveries) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Operational Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Receipts</h3>
                <p className="text-xs text-zinc-500">Inbound vendor shipments & POs</p>
              </div>
            </div>
            <Badge variant="success">INBOUND</Badge>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => navigate('/operations/receipts?status=READY')}
              className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center shadow-xs transition-colors group"
            >
              <div className="text-3xl font-extrabold font-mono group-hover:scale-105 transition-transform">
                {cards?.receipts?.toReceive ?? 0}
              </div>
              <div className="text-xs font-medium text-emerald-100 mt-1 flex items-center justify-center gap-1">
                To Receive <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <div className="flex flex-col gap-2 min-w-36">
              <button
                onClick={() => navigate('/operations/receipts?late=true')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Late
                </span>
                <span className="font-bold font-mono">{cards?.receipts?.late ?? 0}</span>
              </button>

              <button
                onClick={() => navigate('/operations/receipts')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
              >
                <span>Scheduled</span>
                <span className="font-bold font-mono">{cards?.receipts?.operations ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Operational Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Deliveries</h3>
                <p className="text-xs text-zinc-500">Outbound customer shipments & sales orders</p>
              </div>
            </div>
            <Badge variant="danger">OUTBOUND</Badge>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => navigate('/operations/deliveries?status=READY')}
              className="flex-1 py-4 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-center shadow-xs transition-colors group"
            >
              <div className="text-3xl font-extrabold font-mono group-hover:scale-105 transition-transform">
                {cards?.deliveries?.toDeliver ?? 0}
              </div>
              <div className="text-xs font-medium text-rose-100 mt-1 flex items-center justify-center gap-1">
                To Deliver <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <div className="flex flex-col gap-2 min-w-36">
              <button
                onClick={() => navigate('/operations/deliveries?late=true')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Late
                </span>
                <span className="font-bold font-mono">{cards?.deliveries?.late ?? 0}</span>
              </button>

              <button
                onClick={() => navigate('/operations/deliveries?status=WAITING')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Waiting
                </span>
                <span className="font-bold font-mono">{cards?.deliveries?.waiting ?? 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming vs Outgoing Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> Movement Volume Trends (Last 30 Days)
              </h3>
              <p className="text-xs text-zinc-500">Daily incoming receipts vs outgoing deliveries.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="incoming" stroke="#0d9488" fillOpacity={1} fill="url(#colorIn)" name="Incoming" />
                <Area type="monotone" dataKey="outgoing" stroke="#e11d48" fillOpacity={1} fill="url(#colorOut)" name="Outgoing" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Moving Products Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-teal-600" /> Top Moving Products
          </h3>
          <p className="text-xs text-zinc-500">Highest volume items moved in the last 30 days.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topData.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="sku" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip />
                <Bar dataKey="totalMoved" fill="#0d9488" radius={[0, 4, 4, 0]} name="Units Moved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Section: Low Stock Alert Table & Recent Moves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low & Out of Stock Items
            </h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/replenishment')}>
              Replenishment Page
            </Button>
          </div>

          {topData.lowStockList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl">
              All active items have sufficient stock balances!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-medium">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5 text-right">On Hand</th>
                    <th className="p-2.5 text-right">Min Qty</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {topData.lowStockList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">{item.name}</td>
                      <td className="p-2.5 font-mono text-teal-600">{item.sku}</td>
                      <td className="p-2.5 text-right font-mono font-semibold">{item.onHand} {item.uom}</td>
                      <td className="p-2.5 text-right font-mono text-zinc-500">{item.minQty}</td>
                      <td className="p-2.5 text-center">
                        <Badge variant={item.status === 'OUT' ? 'danger' : 'warning'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right">
                        <Button size="sm" onClick={() => navigate('/replenishment')}>
                          Replenish
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Moves List Widget */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Recent Movements</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/moves')}>
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentMoves.map((m) => (
              <div
                key={m.id}
                onClick={() => m.operationId && navigate(`/operations/${m.operationId}`)}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg flex items-center justify-between border border-zinc-100 dark:border-zinc-700/50 hover:border-teal-500 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">{m.reference}</div>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-40">{m.product?.name}</div>
                  <div className="text-[10px] text-zinc-400">{new Date(m.date).toLocaleDateString()}</div>
                </div>

                <div className="text-right">
                  <DirectionBadge type={m.direction} />
                  <div className="font-mono text-xs font-bold mt-1">
                    {m.quantity} {m.product?.uom}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
