import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { FilterChips } from '../../components/ui/FilterChips.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Plus, Download, Upload, Package, Layers, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { listProductsApi, bulkImportProductsApi, exportProductsApi } from '../../api/products.js';
import { listCategoriesApi } from '../../api/categories.js';

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});

  // Filters from URL
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const stockStatus = searchParams.get('stockStatus') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // CSV Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const updateFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await listProductsApi({
        search,
        categoryId,
        stockStatus,
        page,
        limit: 25,
      });
      setProducts(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await listCategoriesApi({ limit: 100 });
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryId, stockStatus, page]);

  // Barcode scanner / direct SKU lookup on Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const matched = products.find((p) => p.sku.toUpperCase() === search.trim().toUpperCase());
      if (matched) {
        navigate(`/products/${matched.id}`);
      }
    }
  };

  const parseCSVString = (csv) => {
    const lines = csv.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push({
        sku: obj.sku || obj['product sku'] || '',
        name: obj.name || obj['product name'] || '',
        uom: obj.uom || 'Units',
        costPrice: parseFloat(obj.costprice || obj['cost price'] || '0') || 0,
        salePrice: parseFloat(obj.saleprice || obj['sale price'] || '0') || null,
        categoryName: obj.category || obj['category name'] || '',
        barcode: obj.barcode || '',
        description: obj.description || '',
      });
    }
    return rows;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setImportText(text);
      const parsed = parseCSVString(text);
      setParsedRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!parsedRows.length) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);
    try {
      const res = await bulkImportProductsApi(parsedRows);
      setImportResults(res.data);
      if (res.data.created > 0 || res.data.updated > 0) {
        toast.success(`Import complete! Created ${res.data.created}, updated ${res.data.updated}`);
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const statusBadgeVariant = (st) => {
    if (st === 'IN_STOCK') return 'success';
    if (st === 'LOW') return 'warning';
    return 'danger';
  };

  const statusLabel = (st) => {
    if (st === 'IN_STOCK') return 'In Stock';
    if (st === 'LOW') return 'Low Stock';
    return 'Out of Stock';
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400">
          {row.sku}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</div>
          {row.barcode && <div className="text-[11px] text-zinc-500">Barcode: {row.barcode}</div>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          {row.category?.name || '—'}
        </span>
      ),
    },
    {
      key: 'uom',
      label: 'UoM',
      render: (row) => <span className="text-xs text-zinc-500">{row.uom}</span>,
    },
    {
      key: 'costPrice',
      label: 'Cost (₹)',
      align: 'right',
      render: (row) => <span className="text-xs font-mono">₹{Number(row.costPrice).toFixed(2)}</span>,
    },
    {
      key: 'totalOnHand',
      label: 'On Hand',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-xs font-mono text-zinc-900 dark:text-zinc-100">
          {row.totalOnHand ?? 0}
        </span>
      ),
    },
    {
      key: 'freeToUse',
      label: 'Free to Use',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-xs font-mono text-emerald-600 dark:text-emerald-400">
          {row.freeToUse ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.stockStatus)} dot>
          {statusLabel(row.stockStatus)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage product catalog, SKUs, barcode search, and inventory balances."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/products/categories')} leftIcon={<Layers className="w-4 h-4" />}>
              Categories
            </Button>
            <Button variant="secondary" onClick={() => setImportModalOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
              Import CSV
            </Button>
            <a href={exportProductsApi()} download="products.csv">
              <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                Export CSV
              </Button>
            </a>
            <Button onClick={() => navigate('/products/new')} leftIcon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={(val) => updateFilters({ search: val, page: '1' })}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search name, SKU or barcode (Enter for direct SKU view)..."
            className="flex-1"
          />

          <Select
            value={categoryId}
            onChange={(e) => updateFilters({ categoryId: e.target.value, page: '1' })}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="w-48"
          />
        </div>

        <FilterChips
          chips={[
            { id: '', label: 'All Status' },
            { id: 'IN_STOCK', label: 'In Stock' },
            { id: 'LOW', label: 'Low Stock' },
            { id: 'OUT', label: 'Out of Stock' },
          ]}
          activeId={stockStatus}
          onChange={(id) => updateFilters({ stockStatus: id, page: '1' })}
        />
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(row) => navigate(`/products/${row.id}`)}
        pagination={meta}
        onPageChange={(p) => updateFilters({ page: String(p) })}
        emptyTitle="No products found"
        emptyDescription="Create your first product or import via CSV to start managing inventory."
        emptyIcon={<Package className="w-8 h-8 text-teal-600" />}
      />

      {/* Import CSV Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportResults(null);
          setParsedRows([]);
        }}
        title="Import Products via CSV"
        description="Upload a CSV file containing product SKUs, names, prices, and categories."
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Need a sample format?</span>
            <a
              href="data:text/csv;charset=utf-8,SKU,Name,Category,UoM,Cost Price,Sale Price,Barcode,Description%0ADESK001,Executive Desk,Furniture,Units,15000,22000,890123456001,Ergonomic executive wooden desk"
              download="sample_products.csv"
              className="text-teal-600 font-medium hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Download Template
            </a>
          </div>

          <FormField label="Select CSV File">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-xs text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950 dark:file:text-teal-300 hover:file:bg-teal-100"
            />
          </FormField>

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Preview ({parsedRows.length} rows detected):
              </div>
              <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono space-y-1 bg-zinc-50 dark:bg-zinc-900">
                {parsedRows.slice(0, 5).map((r, i) => (
                  <div key={i} className="truncate">
                    {r.sku} — {r.name} ({r.categoryName || 'No Cat'}) ₹{r.costPrice}
                  </div>
                ))}
                {parsedRows.length > 5 && <div className="text-zinc-400 text-[11px]">...and {parsedRows.length - 5} more rows</div>}
              </div>
            </div>
          )}

          {importResults && importResults.errors?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-rose-600">Row Errors ({importResults.errors.length}):</div>
              <div className="max-h-32 overflow-y-auto border border-rose-200 dark:border-rose-950 rounded-lg p-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 space-y-1">
                {importResults.errors.map((err, i) => (
                  <div key={i}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="secondary"
              onClick={() => {
                setImportModalOpen(false);
                setImportResults(null);
                setParsedRows([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} loading={importing} disabled={!parsedRows.length}>
              Upload & Process ({parsedRows.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
