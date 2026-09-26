import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  getOperationApi,
  createOperationApi,
  updateOperationApi,
  confirmOperationApi,
  checkOperationAvailabilityApi,
  validateOperationApi,
  cancelOperationApi,
} from '../../api/operations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { listLocationsApi } from '../../api/locations.js';
import { listContactsApi, createContactApi } from '../../api/contacts.js';
import { listProductsApi } from '../../api/products.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useSSE } from '../../hooks/useSSE.js';
import { Button } from '../ui/Button.jsx';
import { StatusPipeline } from '../ui/StatusPipeline.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { FormField } from '../ui/FormField.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Combobox } from '../ui/Combobox.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { LinesEditor } from './LinesEditor.jsx';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Play,
  RotateCcw,
  Ban,
  UserPlus,
} from 'lucide-react';

const formSchema = z.object({
  warehouseId: z.string().min(1, 'Please select a warehouse'),
  contactId: z.string().optional().nullable(),
  sourceLocationId: z.string().optional().nullable(),
  destLocationId: z.string().optional().nullable(),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  deliveryAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function OperationForm({
  type, // 'RECEIPT' | 'DELIVERY' | 'INTERNAL'
  operationId, // null for new, uuid string for existing
  baseRoute, // e.g. '/operations/receipts'
}) {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const canCancel = hasRole('ADMIN', 'MANAGER');
  const isOutgoing = type === 'DELIVERY' || type === 'INTERNAL';

  // State
  const [operation, setOperation] = useState(null);
  const [loadingOp, setLoadingOp] = useState(Boolean(operationId));
  const [lines, setLines] = useState([]);
  const [linesError, setLinesError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showValidateConfirm, setShowValidateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [creatingContact, setCreatingContact] = useState(false);

  // Reference data
  const { data: warehouses = [] } = useFetch(listWarehousesApi, []);
  const { data: contactsData } = useFetch(
    () => listContactsApi({ type: type === 'RECEIPT' ? 'VENDOR' : type === 'DELIVERY' ? 'CUSTOMER' : undefined }),
    [type]
  );
  const contacts = useMemo(
    () => contactsData?.data || (Array.isArray(contactsData) ? contactsData : []),
    [contactsData]
  );

  const { data: products = [] } = useFetch(listProductsApi, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
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

  // Locations for selected warehouse
  const { data: locations = [] } = useFetch(
    () => (selectedWarehouseId ? listLocationsApi({ warehouseId: selectedWarehouseId, type: 'INTERNAL' }) : Promise.resolve([])),
    [selectedWarehouseId]
  );

  // Fetch existing operation
  const fetchOperation = useCallback(async () => {
    if (!operationId) return;
    try {
      setLoadingOp(true);
      const res = await getOperationApi(operationId);
      const op = res.data;
      setOperation(op);
      setLines(op.lines || []);
      reset({
        warehouseId: op.warehouseId || '',
        contactId: op.contactId || '',
        sourceLocationId: op.sourceLocationId || '',
        destLocationId: op.destLocationId || '',
        scheduledDate: op.scheduledDate ? op.scheduledDate.split('T')[0] : '',
        deliveryAddress: op.deliveryAddress || '',
        notes: op.notes || '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load operation');
    } finally {
      setLoadingOp(false);
    }
  }, [operationId, reset]);

  useEffect(() => {
    fetchOperation();
  }, [fetchOperation]);

  // Set default warehouse when creating new
  useEffect(() => {
    if (!operationId && warehouses.length > 0 && !selectedWarehouseId) {
      setValue('warehouseId', warehouses[0].id);
    }
  }, [warehouses, operationId, selectedWarehouseId, setValue]);

  // Auto-fill delivery address when contact changes
  useEffect(() => {
    if (type === 'DELIVERY' && selectedContactId && !operation) {
      const c = contacts.find((item) => item.id === selectedContactId);
      if (c?.address) {
        setValue('deliveryAddress', c.address);
      }
    }
  }, [selectedContactId, contacts, type, operation, setValue]);

  // Live SSE reload
  useSSE('operation.changed', (evt) => {
    if (evt.id === operationId) {
      fetchOperation();
    }
  });

  const isNew = !operationId;
  const status = operation?.status || 'DRAFT';
  const isEditable = isNew || ['DRAFT', 'WAITING'].includes(status);

  // Handle Quick Create Contact
  const handleQuickCreateContact = async (e) => {
    e.preventDefault();
    if (!newContactName.trim()) {
      toast.error('Contact name is required');
      return;
    }
    setCreatingContact(true);
    try {
      const created = await createContactApi({
        name: newContactName.trim(),
        type: type === 'RECEIPT' ? 'VENDOR' : 'CUSTOMER',
        phone: newContactPhone.trim() || null,
        email: newContactEmail.trim() || null,
      });
      toast.success(`Contact "${newContactName}" created`);
      setContactModalOpen(false);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactEmail('');
      setValue('contactId', created.data.id);
    } catch (err) {
      toast.error(err.message || 'Failed to create contact');
    } finally {
      setCreatingContact(false);
    }
  };

  // Save / Submit Form
  const onSubmit = async (formData) => {
    setLinesError('');
    if (lines.length === 0) {
      setLinesError('At least 1 product line is required');
      return;
    }

    const unselected = lines.some((l) => !l.productId);
    if (unselected) {
      setLinesError('All lines must have a valid product selected');
      return;
    }

    const zeroQty = lines.some((l) => !(Number(l.quantity) > 0));
    if (zeroQty) {
      setLinesError('All line quantities must be greater than 0');
      return;
    }

    const payload = {
      type,
      warehouseId: formData.warehouseId,
      contactId: formData.contactId || null,
      sourceLocationId: formData.sourceLocationId || null,
      destLocationId: formData.destLocationId || null,
      scheduledDate: formData.scheduledDate,
      deliveryAddress: formData.deliveryAddress || null,
      notes: formData.notes || null,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
      })),
    };

    try {
      if (isNew) {
        const res = await createOperationApi(payload);
        toast.success(`Operation ${res.data.reference} created`);
        navigate(`${baseRoute}/${res.data.id}`);
      } else {
        await updateOperationApi(operationId, payload);
        toast.success('Operation updated successfully');
        fetchOperation();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save operation');
    }
  };

  // State Transitions
  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await confirmOperationApi(operationId);
      toast.success(
        res.data.status === 'READY'
          ? 'Operation confirmed and marked as READY'
          : 'Operation confirmed, marked as WAITING due to stock shortage'
      );
      fetchOperation();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm operation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    setActionLoading(true);
    try {
      const res = await checkOperationAvailabilityApi(operationId);
      if (res.data.isAvailable) {
        toast.success('Stock is fully available! Operation is now READY.');
      } else {
        toast.warning('Stock is still short for one or more lines.');
      }
      fetchOperation();
    } catch (err) {
      toast.error(err.message || 'Failed to check availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await validateOperationApi(operationId);
      toast.success(`Operation ${res.data.reference} validated! Stock movement completed.`);
      setShowValidateConfirm(false);
      fetchOperation();
    } catch (err) {
      toast.error(err.message || 'Validation failed');
      setShowValidateConfirm(false);
      fetchOperation();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await cancelOperationApi(operationId);
      toast.success(`Operation ${res.data.reference} has been canceled`);
      setShowCancelConfirm(false);
      fetchOperation();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel operation');
    } finally {
      setActionLoading(false);
    }
  };

  // Stepper steps configuration
  const pipelineSteps =
    type === 'RECEIPT'
      ? [
          { id: 'DRAFT', label: 'Draft' },
          { id: 'READY', label: 'Ready' },
          { id: 'DONE', label: 'Done' },
        ]
      : [
          { id: 'DRAFT', label: 'Draft' },
          { id: 'WAITING', label: 'Waiting' },
          { id: 'READY', label: 'Ready' },
          { id: 'DONE', label: 'Done' },
        ];

  if (loadingOp) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Stepper Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {/* Back and Title */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(baseRoute)}
            icon={<ArrowLeft className="w-4 h-4" />}
            aria-label="Back to operations list"
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {operation?.reference || `New ${type === 'RECEIPT' ? 'Receipt' : type === 'DELIVERY' ? 'Delivery Order' : 'Internal Transfer'}`}
              </h1>
              {operation?.isLate && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  Late
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {type} • {operation?.warehouse?.name || 'Warehouse Operation'}
            </p>
          </div>
        </div>

        {/* Stepper / Status Display */}
        <div>
          {status === 'CANCELED' ? (
            <StatusBadge status="CANCELED" size="md" />
          ) : (
            <StatusPipeline steps={pipelineSteps} currentStep={status} />
          )}
        </div>
      </div>

      {/* Action Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Transition buttons based on type and status */}
          {!isNew && status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleConfirm}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              {type === 'RECEIPT' ? 'To Do' : 'Mark as To Do'}
            </Button>
          )}

          {!isNew && status === 'WAITING' && isOutgoing && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleCheckAvailability}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Check Availability
            </Button>
          )}

          {!isNew && status === 'READY' && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => setShowValidateConfirm(true)}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Validate
            </Button>
          )}

          {!isNew && status === 'DONE' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/operations/${operationId}/print`, '_blank')}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Slip
            </Button>
          )}

          {/* Cancel button if permitted */}
          {!isNew && ['DRAFT', 'WAITING', 'READY'].includes(status) && canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelConfirm(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              icon={<Ban className="w-3.5 h-3.5" />}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Save/Discard for editable operations */}
        {isEditable && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(baseRoute)}
            >
              Discard
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isNew ? 'Create Draft' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          {/* Warehouse */}
          <FormField label="Warehouse" required>
            <Select {...register('warehouseId')} disabled={!isEditable}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.shortCode})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Contact (Vendor / Customer) */}
          {type !== 'INTERNAL' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {type === 'RECEIPT' ? 'Receive From (Vendor)' : 'Delivery To (Customer)'}
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <UserPlus className="w-3 h-3" />
                    + New Contact
                  </button>
                )}
              </div>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={contacts.map((c) => ({
                      value: c.id,
                      label: c.name,
                      description: c.phone ? `Phone: ${c.phone}` : c.email || undefined,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!isEditable}
                    placeholder={`Select ${type === 'RECEIPT' ? 'vendor' : 'customer'}...`}
                  />
                )}
              />
            </div>
          )}

          {/* Source Location for Delivery or Transfer */}
          {(type === 'DELIVERY' || type === 'INTERNAL') && (
            <FormField label="Source Location" required>
              <Select {...register('sourceLocationId')} disabled={!isEditable}>
                <option value="">Default Warehouse Stock</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Destination Location for Receipt or Transfer */}
          {(type === 'RECEIPT' || type === 'INTERNAL') && (
            <FormField label="Destination Location" required>
              <Select {...register('destLocationId')} disabled={!isEditable}>
                <option value="">Default Warehouse Stock</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          {/* Scheduled Date */}
          <FormField label="Scheduled Date" required>
            <Input
              type="date"
              {...register('scheduledDate')}
              disabled={!isEditable}
            />
          </FormField>

          {/* Responsible User */}
          <FormField label="Responsible">
            <Input
              value={operation?.responsible?.name || user?.name || ''}
              disabled
              className="bg-zinc-100/60 dark:bg-zinc-800/50 cursor-not-allowed"
            />
          </FormField>

          {/* Delivery Address (for Delivery) */}
          {type === 'DELIVERY' && (
            <FormField label="Delivery Shipping Address" className="md:col-span-2 lg:col-span-3">
              <Textarea
                {...register('deliveryAddress')}
                rows={2}
                disabled={!isEditable}
                placeholder="Shipping destination address for this delivery order..."
              />
            </FormField>
          )}

          {/* Notes */}
          <FormField label="Notes & Remarks" className="md:col-span-2 lg:col-span-3">
            <Textarea
              {...register('notes')}
              rows={2}
              disabled={!isEditable}
              placeholder="Internal operational instructions or references..."
            />
          </FormField>
        </div>

        {/* Lines Editor */}
        <div className="space-y-3 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Product Lines & Quantities
              </h2>
              <p className="text-xs text-zinc-500">
                Specify demand quantities for each product item in this transfer.
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {lines.length} {lines.length === 1 ? 'line' : 'lines'}
            </span>
          </div>

          <LinesEditor
            lines={lines}
            onChange={setLines}
            readOnly={!isEditable}
            isOutgoing={isOutgoing}
            products={products}
            error={linesError}
          />
        </div>
      </form>

      {/* Validate Confirm Dialog */}
      <ConfirmDialog
        open={showValidateConfirm}
        onClose={() => setShowValidateConfirm(false)}
        onConfirm={handleValidate}
        loading={actionLoading}
        title="Validate Stock Transfer"
        message={`Are you sure you want to validate ${operation?.reference || 'this operation'}? This action will immediately move physical stock inventory, write immutable ledger entries, and transition the operation to DONE.`}
        confirmText="Validate & Move Stock"
        variant="primary"
      />

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
        title="Cancel Operation"
        message={`Are you sure you want to cancel ${operation?.reference || 'this operation'}? Any reserved stock will be returned to free-to-use balance.`}
        confirmText="Cancel Operation"
        variant="danger"
      />

      {/* Inline Quick Create Contact Modal */}
      <Modal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`New ${type === 'RECEIPT' ? 'Vendor' : 'Customer'} Contact`}
        description="Quickly register a new contact directory entry."
      >
        <form onSubmit={handleQuickCreateContact} className="space-y-4">
          <FormField label="Full / Company Name" required>
            <Input
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="e.g. Reliance Logistics Ltd"
              autoFocus
            />
          </FormField>
          <FormField label="Phone Number (10 digits)">
            <Input
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              placeholder="9876543210"
              className="font-mono"
            />
          </FormField>
          <FormField label="Email Address">
            <Input
              type="email"
              value={newContactEmail}
              onChange={(e) => setNewContactEmail(e.target.value)}
              placeholder="billing@partner.com"
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setContactModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creatingContact}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
