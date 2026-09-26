import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  getOperationApi,
  createOperationApi,
  updateOperationApi,
  confirmOperationApi,
  checkAvailabilityApi,
  validateOperationApi,
  cancelOperationApi,
} from '../../api/operations.js';
import { listContactsApi } from '../../api/contacts.js';
import { listLocationsApi } from '../../api/locations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listProductsApi } from '../../api/products.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSSE } from '../../hooks/useSSE.js';
import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { DateInput } from '../ui/DateInput.jsx';
import { Combobox } from '../ui/Combobox.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { StatusPipeline } from '../ui/StatusPipeline.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { LinesEditor } from './LinesEditor.jsx';
import { ArrowLeft, Printer, X } from 'lucide-react';

const PIPELINES = {
  RECEIPT: [
    { id: 'DRAFT', label: 'Draft' },
    { id: 'READY', label: 'Ready' },
    { id: 'DONE', label: 'Done' },
  ],
  DELIVERY: [
    { id: 'DRAFT', label: 'Draft' },
    { id: 'WAITING', label: 'Waiting' },
    { id: 'READY', label: 'Ready' },
    { id: 'DONE', label: 'Done' },
  ],
  INTERNAL: [
    { id: 'DRAFT', label: 'Draft' },
    { id: 'WAITING', label: 'Waiting' },
    { id: 'READY', label: 'Ready' },
    { id: 'DONE', label: 'Done' },
  ],
};

const ROUTE_MAP = {
  RECEIPT: '/operations/receipts',
  DELIVERY: '/operations/deliveries',
  INTERNAL: '/operations/transfers',
};

const formSchema = z.object({
  warehouseId: z.string().uuid('Please select a warehouse'),
  contactId: z.string().uuid().optional().nullable(),
  sourceLocationId: z.string().uuid().optional().nullable(),
  destLocationId: z.string().uuid().optional().nullable(),
  scheduledDate: z.string().optional(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export function OperationForm({ type, operationId, baseRoute }) {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isNew = !operationId;
  const canCancel = hasRole('ADMIN', 'MANAGER');

  const [operation, setOperation] = useState(null);
  const [loadingOp, setLoadingOp] = useState(!isNew);
  const [lines, setLines] = useState([]);
  const [linesErrors, setLinesErrors] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);
  const { data: products = [] } = useFetch(listProductsApi, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: '',
      contactId: '',
      sourceLocationId: '',
      destLocationId: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      deliveryAddress: '',
      notes: '',
    },
  });

  const selectedWarehouseId = watch('warehouseId');
  const selectedContactId = watch('contactId');

  const { data: internalLocations = [] } = useFetch(
    () =>
      selectedWarehouseId
        ? listLocationsApi({ warehouseId: selectedWarehouseId, type: 'INTERNAL' })
        : Promise.resolve([]),
    [selectedWarehouseId]
  );

  const { data: vendorContacts = [] } = useFetch(
    () => listContactsApi({ type: type === 'RECEIPT' ? 'VENDOR' : type === 'DELIVERY' ? 'CUSTOMER' : undefined }),
    [type]
  );

  const contactOptions = useMemo(
    () => vendorContacts.map((c) => ({ value: c.id, label: c.name, description: c.email || c.phone || '' })),
    [vendorContacts]
  );

  // Auto-fill delivery address from contact
  useEffect(() => {
    if (type === 'DELIVERY' && selectedContactId && isNew) {
      const contact = vendorContacts.find((c) => c.id === selectedContactId);
      if (contact?.address) setValue('deliveryAddress', contact.address);
    }
  }, [selectedContactId, vendorContacts, type, isNew, setValue]);

  // Set defaults on new form
  useEffect(() => {
    if (isNew && warehouses.length > 0 && !selectedWarehouseId) {
      setValue('warehouseId', warehouses[0].id);
    }
  }, [warehouses, isNew, selectedWarehouseId, setValue]);

  useEffect(() => {
    if (isNew && internalLocations.length > 0) {
      const src = watch('sourceLocationId');
      const dest = watch('destLocationId');
      if (type === 'DELIVERY' && !src) setValue('sourceLocationId', internalLocations[0].id);
      if (type === 'INTERNAL') {
        if (!src) setValue('sourceLocationId', internalLocations[0].id);
        if (!dest && internalLocations.length > 1) setValue('destLocationId', internalLocations[1].id);
      }
      if (type === 'RECEIPT' && !dest) setValue('destLocationId', internalLocations[0].id);
    }
  }, [internalLocations, isNew, type, setValue, watch]);

  // Load existing operation
  useEffect(() => {
    if (operationId) {
      setLoadingOp(true);
      getOperationApi(operationId)
        .then((res) => {
          const op = res.data;
          setOperation(op);
          const linesWithAvail = (op.lines || []).map((l) => ({
            ...l,
            quantity: Number(l.quantity),
            availability: l.availability || null,
          }));
          setLines(linesWithAvail);
          reset({
            warehouseId: op.warehouseId || '',
            contactId: op.contactId || '',
            sourceLocationId: op.sourceLocationId || '',
            destLocationId: op.destLocationId || '',
            scheduledDate: op.scheduledDate ? op.scheduledDate.split('T')[0] : new Date().toISOString().split('T')[0],
            deliveryAddress: op.deliveryAddress || '',
            notes: op.notes || '',
          });
        })
        .catch((err) => toast.error(err.message || 'Failed to load operation'))
        .finally(() => setLoadingOp(false));
    }
  }, [operationId, reset]);

  useSSE('operation.changed', (evt) => {
    if (operationId && evt.id === operationId) {
      getOperationApi(operationId).then((res) => {
        const op = res.data;
        setOperation(op);
        setLines((op.lines || []).map((l) => ({ ...l, quantity: Number(l.quantity), availability: l.availability || null })));
      });
    }
  });

  const validateLines = () => {
    const errs = lines.map((l) => {
      const e = {};
      if (!l.productId) e.productId = 'Select a product';
      if (!l.quantity || l.quantity <= 0) e.quantity = 'Quantity must be > 0';
      return e;
    });
    const hasErrors = errs.some((e) => Object.keys(e).length > 0);
    setLinesErrors(errs);
    return !hasErrors;
  };

  const onSave = async (formData) => {
    if (lines.length === 0) { toast.error('Add at least one product line'); return; }
    if (!validateLines()) { toast.error('Fix line errors before saving'); return; }

    const payload = {
      type,
      warehouseId: formData.warehouseId,
      contactId: formData.contactId || null,
      sourceLocationId: formData.sourceLocationId || null,
      destLocationId: formData.destLocationId || null,
      scheduledDate: formData.scheduledDate || undefined,
      deliveryAddress: formData.deliveryAddress || null,
      notes: formData.notes || null,
      lines: lines.map((l) => ({ ...(l.id ? { id: l.id } : {}), productId: l.productId, quantity: Number(l.quantity) })),
    };

    try {
      setActionLoading('save');
      if (isNew) {
        const res = await createOperationApi(payload);
        toast.success(`${res.data.reference} created`);
        navigate(`${baseRoute}/${res.data.id}`);
      } else {
        const res = await updateOperationApi(operationId, payload);
        setOperation(res.data);
        toast.success('Saved');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setActionLoading(null);
    }
  };

  const runAction = async (action) => {
    setActionLoading(action);
    try {
      let res;
      if (action === 'confirm') res = await confirmOperationApi(operationId);
      else if (action === 'check') res = await checkAvailabilityApi(operationId);
      else if (action === 'validate') res = await validateOperationApi(operationId);
      else if (action === 'cancel') res = await cancelOperationApi(operationId);

      const op = res.data?.operation || res.data;
      setOperation(op);
      const updatedLines = (op.lines || []).map((l) => ({ ...l, quantity: Number(l.quantity), availability: l.availability || null }));
      setLines(updatedLines);

      const labels = { confirm: 'Confirmed', check: 'Availability checked', validate: 'Validated', cancel: 'Canceled' };
      toast.success(labels[action] || 'Done');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_STOCK') {
        toast.error('Insufficient stock — operation moved to Waiting');
        // Reload to get updated status
        const res = await getOperationApi(operationId);
        setOperation(res.data);
        setLines((res.data.lines || []).map((l) => ({ ...l, quantity: Number(l.quantity), availability: l.availability || null })));
      } else {
        toast.error(err.message || 'Action failed');
      }
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const status = operation?.status;
  const isEditable = isNew || ['DRAFT', 'WAITING'].includes(status);
  const showAvailability = ['DELIVERY', 'INTERNAL'].includes(type) && ['DRAFT', 'WAITING', 'READY'].includes(status);

  const pipeline = PIPELINES[type] || PIPELINES.RECEIPT;
  const pipelineStep = status === 'CANCELED' ? null : status;

  if (loadingOp) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const TYPE_LABELS = { RECEIPT: 'Receipt', DELIVERY: 'Delivery', INTERNAL: 'Transfer' };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 flex-wrap">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(baseRoute)} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>

          {/* Action buttons driven by status */}
          {isNew && (
            <Button type="button" variant="primary" size="sm" loading={actionLoading === 'save'} onClick={handleSubmit(onSave)}>
              Create {TYPE_LABELS[type]}
            </Button>
          )}
          {!isNew && isEditable && (
            <Button type="button" variant="secondary" size="sm" loading={actionLoading === 'save'} onClick={handleSubmit(onSave)} disabled={!isDirty && lines.length > 0}>
              Save Changes
            </Button>
          )}
          {status === 'DRAFT' && (
            <Button type="button" variant="primary" size="sm" loading={actionLoading === 'confirm'} onClick={() => setConfirmAction('confirm')}>
              {type === 'RECEIPT' ? 'Mark as To Do' : 'Mark as To Do'}
            </Button>
          )}
          {status === 'WAITING' && (
            <Button type="button" variant="primary" size="sm" loading={actionLoading === 'check'} onClick={() => runAction('check')}>
              Check Availability
            </Button>
          )}
          {status === 'READY' && (
            <Button type="button" variant="primary" size="sm" loading={actionLoading === 'validate'} onClick={() => setConfirmAction('validate')}>
              Validate
            </Button>
          )}
          {status === 'DONE' && (
            <Button type="button" variant="secondary" size="sm" onClick={() => window.open(`/operations/${operationId}/print`, '_blank')} icon={<Printer className="w-3.5 h-3.5" />}>
              Print Slip
            </Button>
          )}
          {canCancel && ['DRAFT', 'WAITING', 'READY'].includes(status) && (
            <Button type="button" variant="danger" size="sm" loading={actionLoading === 'cancel'} onClick={() => setConfirmAction('cancel')} icon={<X className="w-3.5 h-3.5" />}>
              Cancel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {status === 'CANCELED' ? (
            <StatusBadge status="CANCELED" />
          ) : (
            <StatusPipeline steps={pipeline} currentStep={pipelineStep} />
          )}
        </div>
      </div>

      {/* Reference heading */}
      {!isNew && operation && (
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {operation.reference}
          </h1>
          <StatusBadge status={status} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        {/* Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          {/* Warehouse */}
          <FormField label="Warehouse" required error={errors.warehouseId?.message}>
            <Select {...register('warehouseId')} disabled={!isEditable}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.shortCode})</option>
              ))}
            </Select>
          </FormField>

          {/* Contact */}
          {(type === 'RECEIPT' || type === 'DELIVERY') && (
            <FormField label={type === 'RECEIPT' ? 'Receive From (Vendor)' : 'Deliver To (Customer)'} error={errors.contactId?.message}>
              <Combobox
                options={contactOptions}
                value={watch('contactId') || ''}
                onChange={(val) => setValue('contactId', val)}
                placeholder={`Search ${type === 'RECEIPT' ? 'vendor' : 'customer'}...`}
                disabled={!isEditable}
              />
            </FormField>
          )}

          {/* Source location */}
          {(type === 'DELIVERY' || type === 'INTERNAL') && (
            <FormField label="Source Location" required error={errors.sourceLocationId?.message}>
              <Select {...register('sourceLocationId')} disabled={!isEditable}>
                <option value="">Select location...</option>
                {internalLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.shortCode} — {l.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Destination location */}
          {(type === 'RECEIPT' || type === 'INTERNAL') && (
            <FormField label="Destination Location" required error={errors.destLocationId?.message}>
              <Select {...register('destLocationId')} disabled={!isEditable}>
                <option value="">Select location...</option>
                {internalLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.shortCode} — {l.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Scheduled Date */}
          <FormField label="Scheduled Date">
            <DateInput {...register('scheduledDate')} disabled={!isEditable} />
          </FormField>

          {/* Responsible */}
          <FormField label="Responsible">
            <Input value={operation?.responsible?.name || user?.name || ''} readOnly className="bg-zinc-50 dark:bg-zinc-800 cursor-default" />
          </FormField>

          {/* Delivery Address */}
          {type === 'DELIVERY' && (
            <FormField label="Delivery Address" className="md:col-span-2 lg:col-span-3">
              <Textarea {...register('deliveryAddress')} rows={2} disabled={!isEditable} placeholder="Delivery address..." />
            </FormField>
          )}

          {/* Notes */}
          <FormField label="Notes" className="md:col-span-2 lg:col-span-3">
            <Textarea {...register('notes')} rows={2} disabled={!isEditable} placeholder="Optional notes..." />
          </FormField>
        </div>

        {/* Lines */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Product Lines</h2>
            <span className="text-xs text-zinc-500">{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
          </div>
          <LinesEditor
            lines={lines}
            products={products}
            onChange={setLines}
            readOnly={!isEditable}
            showAvailability={showAvailability}
            errors={linesErrors}
          />
        </div>

        {/* Save/Discard footer for new */}
        {isNew && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(baseRoute)}>Discard</Button>
            <Button type="submit" variant="primary" loading={actionLoading === 'save'}>
              Create {TYPE_LABELS[type]}
            </Button>
          </div>
        )}
      </form>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction === 'confirm'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => runAction('confirm')}
        loading={actionLoading === 'confirm'}
        title="Confirm Operation"
        message="Mark this operation as To Do? Stock availability will be checked for outgoing operations."
        confirmText="Confirm"
        variant="primary"
      />
      <ConfirmDialog
        open={confirmAction === 'validate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => runAction('validate')}
        loading={actionLoading === 'validate'}
        title="Validate Operation"
        message="Validate this operation? Stock moves will be applied immediately and cannot be undone."
        confirmText="Validate"
        variant="primary"
      />
      <ConfirmDialog
        open={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => runAction('cancel')}
        loading={actionLoading === 'cancel'}
        title="Cancel Operation"
        message="Cancel this operation? Any reserved stock will be released."
        confirmText="Cancel Operation"
        variant="danger"
      />
    </div>
  );
}
