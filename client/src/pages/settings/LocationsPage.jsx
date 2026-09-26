import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  listLocationsApi,
  createLocationApi,
  updateLocationApi,
  deleteLocationApi,
} from '../../api/locations.js';
import { listWarehousesApi } from '../../api/warehouses.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { FilterChips } from '../../components/ui/FilterChips.jsx';
import { LOCATION_TYPE_CONFIG } from '../../constants/status.js';
import { Plus, Edit2, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const locationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(100),
  shortCode: z
    .string()
    .trim()
    .min(1, 'Short code is required')
    .max(20)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9_-]+$/.test(v), {
      message: 'Short code may only contain uppercase letters, numbers, and hyphens',
    }),
  type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']),
  warehouseId: z.string().uuid().optional().nullable().or(z.literal('')),
});

export function LocationsPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch warehouses for filters and form dropdown
  const { data: warehouses = [] } = useFetch(() => listWarehousesApi());

  // Fetch locations
  const {
    data: locations = [],
    loading,
    error,
    refetch,
  } = useFetch(
    () =>
      listLocationsApi({
        search,
        warehouseId: warehouseFilter || undefined,
        type: typeFilter || undefined,
      }),
    [search, warehouseFilter, typeFilter]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(locationSchema),
  });

  const selectedType = watch('type');

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setServerError('');
    reset({
      name: '',
      shortCode: '',
      type: 'INTERNAL',
      warehouseId: warehouses[0]?.id || '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLocation(loc);
    setServerError('');
    reset({
      name: loc.name,
      shortCode: loc.shortCode,
      type: loc.type,
      warehouseId: loc.warehouseId || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        name: data.name,
        shortCode: data.shortCode,
        type: data.type,
        warehouseId: data.type === 'INTERNAL' ? data.warehouseId || null : null,
      };

      if (editingLocation) {
        await updateLocationApi(editingLocation.id, payload);
        toast.success(`Location "${data.name}" updated successfully`);
      } else {
        await createLocationApi(payload);
        toast.success(`Location "${data.name}" created successfully`);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        err.details.forEach((d) => {
          if (d.path) setError(d.path, { message: d.message });
        });
      }
      setServerError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteLocationApi(deleteTarget.id);
      toast.success(`Location "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not delete location');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeFilters = [
    ...(warehouseFilter
      ? [
          {
            key: 'warehouse',
            label: 'Warehouse',
            value: warehouses.find((w) => w.id === warehouseFilter)?.name || warehouseFilter,
          },
        ]
      : []),
    ...(typeFilter
      ? [
          {
            key: 'type',
            label: 'Type',
            value: LOCATION_TYPE_CONFIG[typeFilter]?.label || typeFilter,
          },
        ]
      : []),
  ];

  const columns = [
    {
      key: 'fullName',
      header: 'Full Location Name',
      render: (loc) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
            {loc.fullName}
          </span>
          <span className="text-xs text-zinc-500 font-medium">({loc.name})</span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (loc) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {loc.warehouse ? `${loc.warehouse.name} (${loc.warehouse.shortCode})` : 'Global / Virtual'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Location Type',
      className: 'w-44',
      render: (loc) => {
        const conf = LOCATION_TYPE_CONFIG[loc.type] || { label: loc.type, color: '' };
        return (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${conf.color}`}>
            {conf.label}
          </span>
        );
      },
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-20 text-right',
            render: (loc) => {
              const isVirtual = loc.warehouseId === null;
              if (isVirtual) return null;

              return (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(loc)}
                    title="Edit location"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(loc)}
                    title="Delete location"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        subtitle="Manage storage racks, floors, and virtual logistics zones."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }, { label: 'Locations' }]}
        actions={
          canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              New Location
            </Button>
          )
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search locations..."
            className="w-64"
          />

          <Select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.shortCode})
              </option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-44"
          >
            <option value="">All Types</option>
            <option value="INTERNAL">Internal</option>
            <option value="VENDOR">Vendor (Virtual)</option>
            <option value="CUSTOMER">Customer (Virtual)</option>
            <option value="ADJUSTMENT">Adjustment (Virtual)</option>
          </Select>
        </div>
      </div>

      <FilterChips
        filters={activeFilters}
        onRemove={(key) => {
          if (key === 'warehouse') setWarehouseFilter('');
          if (key === 'type') setTypeFilter('');
        }}
        onClearAll={() => {
          setWarehouseFilter('');
          setTypeFilter('');
        }}
      />

      {error ? (
        <ErrorState
          title="Failed to load locations"
          message={error.message || 'Could not retrieve location records.'}
          onRetry={refetch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={locations}
          loading={loading}
          onRowClick={canEdit ? (loc) => loc.warehouseId && handleOpenEdit(loc) : undefined}
          emptyState={
            <EmptyState
              icon={<MapPin className="w-8 h-8 text-zinc-400" />}
              title="No locations found"
              description={
                search || warehouseFilter || typeFilter
                  ? 'No locations match your current filters. Try resetting them.'
                  : 'Get started by creating a storage location.'
              }
              action={
                canEdit && !search && !warehouseFilter && !typeFilter && (
                  <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
                    New Location
                  </Button>
                )
              }
            />
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLocation ? `Edit Location: ${editingLocation.name}` : 'New Location'}
        description="Configure location details. Internal locations must belong to a physical warehouse."
      >
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Location Name" error={errors.name?.message} required>
            <Input
              {...register('name')}
              placeholder="e.g. Rack A-12"
              icon={<MapPin className="w-4 h-4" />}
              autoFocus
            />
          </FormField>

          <FormField
            label="Short Code"
            error={errors.shortCode?.message}
            hint="Uppercase, unique within warehouse (e.g. RACK-A)"
            required
          >
            <Input {...register('shortCode')} placeholder="e.g. RACK-A" />
          </FormField>

          <FormField label="Location Type" error={errors.type?.message} required>
            <Select {...register('type')} disabled={Boolean(editingLocation?.warehouseId === null)}>
              <option value="INTERNAL">Internal Physical Location</option>
              <option value="VENDOR">Vendor (Virtual Counterparty)</option>
              <option value="CUSTOMER">Customer (Virtual Counterparty)</option>
              <option value="ADJUSTMENT">Inventory Adjustment (Loss/Scrap)</option>
            </Select>
          </FormField>

          {selectedType === 'INTERNAL' && (
            <FormField
              label="Assigned Warehouse"
              error={errors.warehouseId?.message}
              required
            >
              <Select {...register('warehouseId')} disabled={Boolean(editingLocation)}>
                <option value="" disabled>
                  Select Warehouse...
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.shortCode})
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editingLocation ? 'Update Location' : 'Create Location'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        isDanger
        title="Delete Location"
        message={`Are you sure you want to delete location "${deleteTarget?.fullName || deleteTarget?.name}"? Deletion will be rejected if it holds physical stock or open operations.`}
        confirmText="Delete Location"
      />
    </div>
  );
}
