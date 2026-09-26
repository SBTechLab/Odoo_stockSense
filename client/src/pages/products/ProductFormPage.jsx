import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DirectionBadge } from '../../components/ui/DirectionBadge.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Package, ArrowLeft, Trash2, Edit, Save, Plus, AlertCircle, History, Sliders, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

import {
  getProductApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getProductStockApi,
  getProductMovesApi,
} from '../../api/products.js';
import { listCategoriesApi } from '../../api/categories.js';
import { listLocationsApi } from '../../api/locations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listContactsApi } from '../../api/contacts.js';
import {
  listReorderRulesApi,
  createReorderRuleApi,
  updateReorderRuleApi,
  deleteReorderRuleApi,
} from '../../api/reorderRules.js';

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [activeTab, setActiveTab] = useState('overview');
  const [_loading, setLoading] = useState(!isNew);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Product form data
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    uom: 'Units',
    costPrice: '0',
    salePrice: '',
    barcode: '',
    description: '',
    addInitialStock: false,
    initialStock: '0',
    locationId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Detail view state
  const [productData, setProductData] = useState(null);
  const [stockBreakdown, setStockBreakdown] = useState([]);
  const [moves, setMoves] = useState([]);
  const [reorderRules, setReorderRules] = useState([]);

  // Reorder Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ warehouseId: '', minQty: '5', maxQty: '20', preferredVendorId: '' });
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleErrors, setRuleErrors] = useState({});

  const loadMasterData = async () => {
    try {
      const [catsRes, locsRes, whsRes, vendorsRes] = await Promise.all([
        listCategoriesApi({ limit: 100 }),
        listLocationsApi({ type: 'INTERNAL', limit: 100 }),
        listWarehousesApi({ limit: 100 }),
        listContactsApi({ type: 'VENDOR', limit: 100 }),
      ]);
      setCategories(catsRes.data || []);
      setLocations(locsRes.data || []);
      setWarehouses(whsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductDetail = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await getProductApi(id);
      const prod = res.data;
      setProductData(prod);
      setFormData({
        name: prod.name,
        sku: prod.sku,
        categoryId: prod.categoryId || '',
        uom: prod.uom || 'Units',
        costPrice: String(prod.costPrice ?? 0),
        salePrice: prod.salePrice ? String(prod.salePrice) : '',
        barcode: prod.barcode || '',
        description: prod.description || '',
        addInitialStock: false,
        initialStock: '0',
        locationId: '',
      });

      // Load breakdown, rules, and moves
      const [stockRes, movesRes, rulesRes] = await Promise.all([
        getProductStockApi(id),
        getProductMovesApi(id, { limit: 100 }),
        listReorderRulesApi({ productId: id }),
      ]);
      setStockBreakdown(stockRes.data || []);
      setMoves(movesRes.data || []);
      setReorderRules(rulesRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load product details');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
    fetchProductDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-suggest SKU from name when creating
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (isNew && (!formData.sku || formData.sku === autoGenerateSku(formData.name))) {
      setFormData({
        ...formData,
        name: val,
        sku: autoGenerateSku(val),
      });
    } else {
      setFormData({ ...formData, name: val });
    }
  };

  const autoGenerateSku = (nameStr) => {
    if (!nameStr) return '';
    const clean = nameStr
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    return clean ? `${clean}001` : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      name: formData.name,
      sku: formData.sku.toUpperCase(),
      categoryId: formData.categoryId || null,
      uom: formData.uom,
      costPrice: parseFloat(formData.costPrice || '0'),
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      barcode: formData.barcode || null,
      description: formData.description || null,
    };

    if (isNew && formData.addInitialStock && parseFloat(formData.initialStock) > 0) {
      payload.initialStock = parseFloat(formData.initialStock);
      payload.locationId = formData.locationId;
    }

    try {
      if (isNew) {
        const res = await createProductApi(payload);
        toast.success('Product created successfully');
        navigate(`/products/${res.data.id}`);
      } else {
        await updateProductApi(id, payload);
        toast.success('Product updated successfully');
        fetchProductDetail();
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          if (d.path) fieldErrors[d.path] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(err.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      await deleteProductApi(id);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // Reorder Rule Handlers
  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ warehouseId: warehouses[0]?.id || '', minQty: '5', maxQty: '25', preferredVendorId: '' });
    setRuleErrors({});
    setRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      warehouseId: rule.warehouseId,
      minQty: String(rule.minQty),
      maxQty: String(rule.maxQty),
      preferredVendorId: rule.preferredVendorId || '',
    });
    setRuleErrors({});
    setRuleModalOpen(true);
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setRuleSubmitting(true);
    setRuleErrors({});

    const payload = {
      productId: id,
      warehouseId: ruleForm.warehouseId,
      minQty: parseFloat(ruleForm.minQty),
      maxQty: parseFloat(ruleForm.maxQty),
      preferredVendorId: ruleForm.preferredVendorId || null,
    };

    try {
      if (editingRule) {
        await updateReorderRuleApi(editingRule.id, payload);
        toast.success('Reorder rule updated');
      } else {
        await createReorderRuleApi(payload);
        toast.success('Reorder rule created');
      }
      setRuleModalOpen(false);
      fetchProductDetail();
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const errs = {};
        err.details.forEach((d) => {
          if (d.path) errs[d.path] = d.message;
        });
        setRuleErrors(errs);
      } else {
        toast.error(err.message || 'Failed to save reorder rule');
      }
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteReorderRuleApi(ruleId);
      toast.success('Reorder rule removed');
      fetchProductDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to remove reorder rule');
    }
  };

  // Stock history line chart data
  const chartData = moves
    .slice()
    .reverse()
    .map((m, idx) => ({
      step: `Move ${idx + 1}`,
      date: new Date(m.date).toLocaleDateString(),
      qty: m.quantity,
      direction: m.direction,
    }));

  const stockColumns = [
    { key: 'fullName', label: 'Location' },
    { key: 'warehouseName', label: 'Warehouse' },
    { key: 'onHand', label: 'On Hand', align: 'right', render: (r) => <span className="font-mono font-medium">{r.onHand}</span> },
    { key: 'reserved', label: 'Reserved', align: 'right', render: (r) => <span className="font-mono text-zinc-500">{r.reserved}</span> },
    { key: 'freeToUse', label: 'Free to Use', align: 'right', render: (r) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{r.freeToUse}</span> },
    { key: 'stockValue', label: 'Value (₹)', align: 'right', render: (r) => <span className="font-mono">₹{r.stockValue.toFixed(2)}</span> },
  ];

  const moveColumns = [
    { key: 'reference', label: 'Reference', render: (r) => <span className="font-mono font-medium">{r.reference}</span> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-xs text-zinc-500">{new Date(r.date).toLocaleString()}</span> },
    { key: 'direction', label: 'Direction', render: (r) => <DirectionBadge type={r.direction} /> },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'quantity', label: 'Qty', align: 'right', render: (r) => <span className="font-mono font-semibold">{r.quantity}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? 'New Product' : productData?.name || 'Product Details'}
        subtitle={isNew ? 'Define product SKU, pricing, and optional initial stock balance.' : `SKU: ${productData?.sku || ''}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: isNew ? 'New' : productData?.sku || 'Details' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/products')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            {!isNew && (
              <Button variant="danger" onClick={() => setDeleteOpen(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      {!isNew && (
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview & Form' },
            { id: 'reorder', label: `Reorder Rules (${reorderRules.length})` },
            { id: 'moves', label: `Move History (${moves.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      )}

      {/* OVERVIEW / FORM TAB */}
      {(isNew || activeTab === 'overview') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Product Name" required error={errors.name}>
                <Input value={formData.name} onChange={handleNameChange} placeholder="e.g. Executive Wooden Desk" />
              </FormField>

              <FormField label="SKU (Stock Keeping Unit)" required error={errors.sku}>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. DESK001"
                  className="font-mono uppercase"
                />
              </FormField>

              <FormField label="Category" error={errors.categoryId}>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Category...' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </FormField>

              <FormField label="Unit of Measure (UoM)" required error={errors.uom}>
                <Select
                  value={formData.uom}
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                  options={[
                    { value: 'Units', label: 'Units' },
                    { value: 'kg', label: 'kg' },
                    { value: 'g', label: 'g' },
                    { value: 'm', label: 'm' },
                    { value: 'L', label: 'L' },
                    { value: 'box', label: 'box' },
                    { value: 'pack', label: 'pack' },
                  ]}
                />
              </FormField>

              <FormField label="Cost Price (₹)" required error={errors.costPrice}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </FormField>

              <FormField label="Sale Price (₹)" error={errors.salePrice}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="Optional sale price..."
                />
              </FormField>

              <FormField label="Barcode" error={errors.barcode}>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g. 890123456001"
                />
              </FormField>
            </div>

            <FormField label="Description" error={errors.description}>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item specification, dimension, or supplier notes..."
                rows={3}
              />
            </FormField>

            {isNew && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-4">
                <Checkbox
                  id="addInitialStock"
                  checked={formData.addInitialStock}
                  onChange={(e) => setFormData({ ...formData, addInitialStock: e.target.checked })}
                  label="Add initial stock balance for this product"
                />

                {formData.addInitialStock && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField label="Initial Quantity" required error={errors.initialStock}>
                      <Input
                        type="number"
                        min="1"
                        value={formData.initialStock}
                        onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Target Location" required error={errors.locationId}>
                      <Select
                        value={formData.locationId}
                        onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                        options={[
                          { value: '', label: 'Select Location...' },
                          ...locations.map((l) => ({ value: l.id, label: `${l.warehouse?.shortCode || ''}/${l.shortCode}` })),
                        ]}
                      />
                    </FormField>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} leftIcon={<Save className="w-4 h-4" />}>
                {isNew ? 'Create Product' : 'Save Changes'}
              </Button>
            </div>
          </form>

          {/* Right Column Metrics (Detail Mode) */}
          {!isNew && productData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="On Hand" value={`${productData.totalOnHand ?? 0} ${productData.uom}`} />
                <StatCard title="Free to Use" value={`${productData.freeToUse ?? 0} ${productData.uom}`} />
                <StatCard title="Stock Value" value={`₹${(productData.stockValue ?? 0).toFixed(2)}`} />
                <StatCard title="Stock Status" value={productData.stockStatus} />
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Stock per Location</h3>
                <DataTable columns={stockColumns} data={stockBreakdown} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* REORDER RULES TAB */}
      {!isNew && activeTab === 'reorder' && (
        <div className="space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Reorder Minimum Rules</h3>
              <p className="text-xs text-zinc-500">Automatically flag replenishment orders when stock drops below minimum threshold.</p>
            </div>
            <Button onClick={handleOpenCreateRule} leftIcon={<Plus className="w-4 h-4" />}>
              Add Rule
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name },
              { key: 'minQty', label: 'Min Qty', align: 'right', render: (r) => <span className="font-mono">{r.minQty}</span> },
              { key: 'maxQty', label: 'Max Qty', align: 'right', render: (r) => <span className="font-mono">{r.maxQty}</span> },
              { key: 'vendor', label: 'Preferred Vendor', render: (r) => r.preferredVendor?.name || '—' },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (r) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEditRule(r)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => handleDeleteRule(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={reorderRules}
            emptyTitle="No reorder rules set"
            emptyDescription="Add a rule to trigger low-stock alerts when stock drops below threshold."
          />
        </div>
      )}

      {/* MOVE HISTORY TAB */}
      {!isNew && activeTab === 'moves' && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Movement Quantity Trend</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="step" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="qty" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Stock Ledger Moves</h3>
            <DataTable columns={moveColumns} data={moves} />
          </div>
        </div>
      )}

      {/* Reorder Rule Modal */}
      <Modal open={ruleModalOpen} onClose={() => setRuleModalOpen(false)} title={editingRule ? 'Edit Reorder Rule' : 'Add Reorder Rule'}>
        <form onSubmit={handleRuleSubmit} className="space-y-4 pt-2">
          <FormField label="Warehouse" required error={ruleErrors.warehouseId}>
            <Select
              value={ruleForm.warehouseId}
              onChange={(e) => setRuleForm({ ...ruleForm, warehouseId: e.target.value })}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Min Quantity" required error={ruleErrors.minQty}>
              <Input type="number" min="0" value={ruleForm.minQty} onChange={(e) => setRuleForm({ ...ruleForm, minQty: e.target.value })} />
            </FormField>
            <FormField label="Max Quantity" required error={ruleErrors.maxQty}>
              <Input type="number" min="1" value={ruleForm.maxQty} onChange={(e) => setRuleForm({ ...ruleForm, maxQty: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Preferred Vendor" error={ruleErrors.preferredVendorId}>
            <Select
              value={ruleForm.preferredVendorId}
              onChange={(e) => setRuleForm({ ...ruleForm, preferredVendorId: e.target.value })}
              options={[{ value: '', label: 'None' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={ruleSubmitting}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProduct}
        loading={deleting}
        title="Delete Product"
        description="Are you sure you want to delete this product? If historical moves exist, it will be soft-deleted."
        confirmText="Delete Product"
        variant="danger"
      />
    </div>
  );
}
