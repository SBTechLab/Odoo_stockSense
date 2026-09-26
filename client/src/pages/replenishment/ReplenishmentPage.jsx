import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Checkbox } from '../../components/ui/Checkbox.jsx';
import { RefreshCw, ShoppingBag, AlertCircle, CheckCircle, FilePlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { listReplenishmentApi } from '../../api/replenishment.js';
import { createOperationApi } from '../../api/operations.js';
import { listContactsApi } from '../../api/contacts.js';

export function ReplenishmentPage() {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected row IDs for batch order creation
  const [selectedIds, setSelectedIds] = useState([]);
  // Editable quantities per rule ID: { [ruleId]: number }
  const [editedQuantities, setEditedQuantities] = useState({});
  // Editable vendor IDs per rule ID: { [ruleId]: vendorId }
  const [editedVendors, setEditedVendors] = useState({});

  const [creatingOrders, setCreatingOrders] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const [sugRes, venRes] = await Promise.all([
        listReplenishmentApi(),
        listContactsApi({ type: 'VENDOR', limit: 100 }),
      ]);
      const list = sugRes.data || [];
      setSuggestions(list);
      setVendors(venRes.data || []);

      const initialQtys = {};
      const initialVendors = {};
      list.forEach((s) => {
        initialQtys[s.id] = s.suggestedQty;
        initialVendors[s.id] = s.preferredVendorId || (venRes.data?.[0]?.id || '');
      });
      setEditedQuantities(initialQtys);
      setEditedVendors(initialVendors);
    } catch (err) {
      toast.error(err.message || 'Failed to load replenishment suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(suggestions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleQtyChange = (id, val) => {
    setEditedQuantities({
      ...editedQuantities,
      [id]: parseFloat(val || '0'),
    });
  };

  const handleVendorChange = (id, vendorId) => {
    setEditedVendors({
      ...editedVendors,
      [id]: vendorId,
    });
  };

  const handleCreateDraftReceipts = async () => {
    if (!selectedIds.length) {
      toast.error('Please select at least one item to reorder');
      return;
    }

    const selectedItems = suggestions.filter((s) => selectedIds.includes(s.id));

    // Group selected items by (preferredVendorId, warehouseId)
    const groups = new Map();
    for (const item of selectedItems) {
      const vendorId = editedVendors[item.id] || item.preferredVendorId || vendors[0]?.id;
      if (!vendorId) {
        toast.error(`Vendor missing for ${item.product.name}`);
        return;
      }

      const key = `${vendorId}_${item.warehouseId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          warehouseId: item.warehouseId,
          contactId: vendorId,
          lines: [],
        });
      }

      const qty = editedQuantities[item.id] !== undefined ? editedQuantities[item.id] : item.suggestedQty;
      if (qty > 0) {
        groups.get(key).lines.push({
          productId: item.productId,
          quantity: qty,
        });
      }
    }

    if (!groups.size) {
      toast.error('No lines with quantity > 0 selected');
      return;
    }

    setCreatingOrders(true);
    let createdCount = 0;
    const createdRefs = [];

    try {
      for (const group of groups.values()) {
        const payload = {
          type: 'RECEIPT',
          warehouseId: group.warehouseId,
          contactId: group.contactId,
          notes: 'Auto-generated from Replenishment suggestions',
          lines: group.lines,
        };

        const res = await createOperationApi(payload);
        createdCount++;
        if (res.data?.reference) createdRefs.push(res.data.reference);
      }

      toast.success(`Successfully created ${createdCount} draft receipt(s): ${createdRefs.join(', ')}`);
      setSelectedIds([]);
      fetchSuggestions();
    } catch (err) {
      toast.error(err.message || 'Failed to create draft receipts');
    } finally {
      setCreatingOrders(false);
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <Checkbox
          checked={suggestions.length > 0 && selectedIds.length === suggestions.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      render: (r) => (
        <Checkbox
          checked={selectedIds.includes(r.id)}
          onChange={() => handleToggleSelect(r.id)}
        />
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (r) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.product.name}</div>
          <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400">SKU: {r.product.sku}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (r) => <span className="text-xs text-zinc-600 dark:text-zinc-400">{r.warehouse.name}</span>,
    },
    {
      key: 'onHand',
      label: 'On Hand',
      align: 'right',
      render: (r) => <span className="font-mono font-semibold text-xs text-rose-600">{r.onHand} {r.product.uom}</span>,
    },
    {
      key: 'minMax',
      label: 'Min / Max',
      align: 'center',
      render: (r) => <span className="font-mono text-xs text-zinc-500">{r.minQty} / {r.maxQty}</span>,
    },
    {
      key: 'suggestedQty',
      label: 'Order Qty',
      align: 'right',
      render: (r) => (
        <Input
          type="number"
          min="1"
          value={editedQuantities[r.id] !== undefined ? editedQuantities[r.id] : r.suggestedQty}
          onChange={(e) => handleQtyChange(r.id, e.target.value)}
          className="w-24 text-right font-mono font-bold text-xs"
        />
      ),
    },
    {
      key: 'vendor',
      label: 'Preferred Vendor',
      render: (r) => (
        <Select
          value={editedVendors[r.id] || r.preferredVendorId || ''}
          onChange={(e) => handleVendorChange(r.id, e.target.value)}
          options={vendors.map((v) => ({ value: v.id, label: v.name }))}
          className="w-44 text-xs"
        />
      ),
    },
    {
      key: 'receiptStatus',
      label: 'Open Receipt',
      align: 'center',
      render: (r) =>
        r.hasOpenReceipt ? (
          <Badge variant="warning" dot>
            Order Open
          </Badge>
        ) : (
          <Badge variant="neutral">None</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Replenishment & Purchase Triggers"
        subtitle="Automated reorder suggestions based on warehouse minimum rules."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Replenishment' }]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchSuggestions} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
            <Button
              onClick={handleCreateDraftReceipts}
              loading={creatingOrders}
              disabled={!selectedIds.length}
              leftIcon={<FilePlus className="w-4 h-4" />}
            >
              Create Draft Receipts ({selectedIds.length})
            </Button>
          </div>
        }
      />

      {/* Info Notice Banner */}
      <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-xl text-xs text-teal-800 dark:text-teal-300">
        <ShoppingBag className="w-5 h-5 shrink-0 text-teal-600" />
        <div>
          <span className="font-semibold">Automated Procurement:</span> Select reorder items below to group them by vendor and automatically generate draft Goods Receipts (`WH/IN/****`).
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suggestions}
        loading={loading}
        emptyTitle="No replenishment needed!"
        emptyDescription="All products across warehouses are above their minimum stock thresholds."
        emptyIcon={<CheckCircle className="w-8 h-8 text-emerald-600" />}
      />
    </div>
  );
}
