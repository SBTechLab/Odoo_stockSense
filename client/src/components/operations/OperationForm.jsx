import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
import { VoiceCommand } from '../voice/VoiceCommand.jsx';
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

// Optional id fields: '' means "not selected". Hidden fields (e.g. source location on a
// receipt) stay '' and must not fail validation; the server fills in virtual locations.
const optionalId = z.union([z.string().uuid(), z.literal('')]).optional().nullable();

const formSchema = z.object({
  warehouseId: z.string().uuid('Please select a warehouse'),
  contactId: optionalId,
  sourceLocationId: optionalId,
  destLocationId: optionalId,
  scheduledDate: z.string().optional(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export function OperationForm({ type, operationId, baseRoute }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user, hasRole } = useAuth();
  const isNew = !operationId;
  const canCancel = hasRole('ADMIN', 'MANAGER');

  const [operation, setOperation] = useState(null);
  const [loadingOp, setLoadingOp] = useState(!isNew);
  const [lines, setLines] = useState([]);
  const [linesErrors, setLinesErrors] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [linesDirty, setLinesDirty] = useState(false);
  // Locations chosen by a voice command; applied once that warehouse's locations have loaded.
  const pendingVoiceLocations = useRef(null);

  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);
  const { data: products = [] } = useFetch(() => listProductsApi({ limit: 100 }), []);

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

  // Fetch all contacts and filter client-side so BOTH-type contacts appear for receipts and deliveries.
  const { data: allContacts = [] } = useFetch(() => listContactsApi({ limit: 100 }), []);
  const vendorContacts = useMemo(() => {
    const wanted = type === 'RECEIPT' ? 'VENDOR' : type === 'DELIVERY' ? 'CUSTOMER' : null;
    return wanted ? allContacts.filter((c) => c.type === wanted || c.type === 'BOTH') : allContacts;
  }, [allContacts, type]);

  const contactOptions = useMemo(
    () => vendorContacts.map((c) => ({ value: c.id, label: c.name, description: c.email || c.phone || '' })),
    [vendorContacts]
  );

  // Auto-fill delivery address from contact
  useEffect(() => {
    if (type === 'DELIVERY' && selectedContactId && isNew) {
      const contact = vendorContacts.find((c) => c.id === selectedContactId);
      if (contact?.address && !watch('deliveryAddress')) setValue('deliveryAddress', contact.address);
    }
  }, [selectedContactId, vendorContacts, type, isNew, setValue, watch]);

  // Set defaults on new form
  useEffect(() => {
    if (isNew && warehouses.length > 0 && !selectedWarehouseId) {
      setValue('warehouseId', warehouses[0].id);
    }
  }, [warehouses, isNew, selectedWarehouseId, setValue]);

  // Default locations for the selected warehouse; re-pick when the warehouse changes
  // so a location from another warehouse is never submitted.
  useEffect(() => {
    if (!isNew || internalLocations.length === 0) return;
    const ids = new Set(internalLocations.map((l) => l.id));
    const pending = pendingVoiceLocations.current;
    if (pending && pending.warehouseId === selectedWarehouseId) {
      // wait until the voice-selected warehouse's locations are the ones loaded
      if (![pending.sourceLocationId, pending.destLocationId].filter(Boolean).every((id) => ids.has(id))) return;
      if (pending.sourceLocationId) setValue('sourceLocationId', pending.sourceLocationId, { shouldDirty: true });
      if (pending.destLocationId) setValue('destLocationId', pending.destLocationId, { shouldDirty: true });
      pendingVoiceLocations.current = null;
      return;
    }
    const wh = warehouses.find((w) => w.id === selectedWarehouseId);
    const defaultId = wh?.defaultLocationId && ids.has(wh.defaultLocationId) ? wh.defaultLocationId : internalLocations[0].id;
    const src = watch('sourceLocationId');
    const dest = watch('destLocationId');
    if ((type === 'DELIVERY' || type === 'INTERNAL') && !ids.has(src)) setValue('sourceLocationId', defaultId);
    if (type === 'RECEIPT' && !ids.has(dest)) setValue('destLocationId', defaultId);
    if (type === 'INTERNAL' && !ids.has(dest)) {
      const other = internalLocations.find((l) => l.id !== (ids.has(src) ? src : defaultId));
      setValue('destLocationId', other?.id || '');
    }
  }, [internalLocations, warehouses, selectedWarehouseId, isNew, type, setValue, watch]);

  // Load existing operation
  useEffect(() => {
    if (operationId) {
      setLoadingOp(true);
      getOperationApi(operationId)
        .then((res) => applyOperation(res.data))
        .catch((err) => toast.error(err.message || 'Failed to load operation'))
        .finally(() => setLoadingOp(false));
    }
    // Load only when the id changes; applyOperation is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationId, reset]);

  useSSE('operation.changed', (evt) => {
    if (operationId && evt.id === operationId) {
      // Keep unsaved edits made in this tab.
      if (isDirty || linesDirty) return;
      getOperationApi(operationId).then((res) => applyOperation(res.data)).catch(() => {});
    }
  });

  /** Put a server operation into local state and reset the form's dirty tracking. */
  const applyOperation = (op) => {
    setOperation(op);
    setLines((op.lines || []).map((l) => ({ ...l, quantity: Number(l.quantity), availability: l.availability || null })));
    setLinesDirty(false);
    reset({
      warehouseId: op.warehouseId || '',
      contactId: op.contactId || '',
      sourceLocationId: op.sourceLocationId || '',
      destLocationId: op.destLocationId || '',
      scheduledDate: op.scheduledDate ? String(op.scheduledDate).split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryAddress: op.deliveryAddress || '',
      notes: op.notes || '',
    });
  };

  const handleLinesChange = (next) => {
    setLines(next);
    setLinesDirty(true);
  };

  /** Voice "Edit": fill this form with the parsed command (or open the right form for another type). */
  const applyVoiceResult = (result) => {
    const voiceType = result.intent.value;
    if (voiceType !== type) {
      navigate(`${ROUTE_MAP[voiceType]}/new`, { state: { voiceResult: result } });
      return;
    }
    if (result.warehouse) {
      pendingVoiceLocations.current = {
        warehouseId: result.warehouse.id,
        sourceLocationId: result.sourceLocation?.id ?? null,
        destLocationId: result.destLocation?.id ?? null,
      };
      setValue('warehouseId', result.warehouse.id, { shouldDirty: true });
    }
    setValue('contactId', result.contact?.id ?? '', { shouldDirty: true });
    if (result.product) {
      setLines([{ productId: result.product.id, quantity: result.quantity > 0 ? result.quantity : 1, _key: Date.now() }]);
      setLinesDirty(true);
    }
    toast.info('Form filled from your command — review and click Create.');
  };

  /** Voice "Confirm": the operation was created as a draft; open it. */
  const handleVoiceCreated = (op, voiceType) => {
    navigate(`${ROUTE_MAP[voiceType]}/${op.id}`);
  };

  // Arriving from another form's voice panel with a different operation type.
  const voiceFromNav = routerLocation.state?.voiceResult;
  const appliedNavVoice = useRef(false);
  useEffect(() => {
    if (!isNew || !voiceFromNav || appliedNavVoice.current || warehouses.length === 0) return;
    appliedNavVoice.current = true;
    applyVoiceResult(voiceFromNav);
    // clear history state so a refresh doesn't re-apply it
    navigate(routerLocation.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, voiceFromNav, warehouses.length]);

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
    if (type === 'INTERNAL') {
      if (!formData.sourceLocationId || !formData.destLocationId) { toast.error('Select source and destination locations'); return; }
      if (formData.sourceLocationId === formData.destLocationId) { toast.error('Source and destination must be different'); return; }
    }
    if (type === 'DELIVERY' && !formData.sourceLocationId) { toast.error('Select a source location'); return; }

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
        // Reload so line availability (shortages) is recomputed by the server.
        const fresh = await getOperationApi(operationId).catch(() => null);
        applyOperation(fresh?.data || res.data);
        toast.success('Saved');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setActionLoading(null);
    }
  };

  // Surface form validation errors (some fields may be hidden for this operation type).
  const onInvalid = (formErrors) => {
    const first = Object.values(formErrors)[0];
    toast.error(first?.message || 'Please fix the highlighted fields');
  };

  const runAction = async (action) => {
    setActionLoading(action);
    try {
      let res;
      if (action === 'confirm') res = await confirmOperationApi(operationId);
      else if (action === 'check') res = await checkAvailabilityApi(operationId);
      else if (action === 'validate') res = await validateOperationApi(operationId);
      else if (action === 'cancel') res = await cancelOperationApi(operationId);

      // Reload the full operation so lines carry fresh availability info.
      const fresh = await getOperationApi(operationId).catch(() => null);
      const op = fresh?.data || res.data?.operation || res.data;
      applyOperation(op);

      if ((action === 'confirm' || action === 'check') && op?.status === 'WAITING') {
        toast.warning('Not enough stock — operation is waiting for stock');
      } else {
        const labels = { confirm: 'Marked as To Do', check: 'Stock available — operation is Ready', validate: 'Validated — stock updated', cancel: 'Canceled' };
        toast.success(labels[action] || 'Done');
      }
    } catch (err) {
      toast.error(err.message || (err.code === 'INSUFFICIENT_STOCK' ? 'Insufficient stock' : 'Action failed'));
      // Reload to reflect any status change made by the server (e.g. moved to Waiting).
      const res = await getOperationApi(operationId).catch(() => null);
      if (res?.data) applyOperation(res.data);
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
            <Button type="button" variant="primary" size="sm" loading={actionLoading === 'save'} onClick={handleSubmit(onSave, onInvalid)}>
              Create {TYPE_LABELS[type]}
            </Button>
          )}
          {!isNew && isEditable && (
            <Button type="button" variant="secondary" size="sm" loading={actionLoading === 'save'} onClick={handleSubmit(onSave, onInvalid)} disabled={!isDirty && !linesDirty}>
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

      {/* Voice-to-Action (new operations only) */}
      {isNew && <VoiceCommand contextType={type} onEdit={applyVoiceResult} onCreated={handleVoiceCreated} />}

      {/* Form */}
      <form onSubmit={handleSubmit(onSave, onInvalid)} className="space-y-5">
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
                onChange={(val) => setValue('contactId', val || '', { shouldDirty: true })}
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
            onChange={handleLinesChange}
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
