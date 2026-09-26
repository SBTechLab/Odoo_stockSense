import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  listWarehousesApi,
  createWarehouseApi,
  updateWarehouseApi,
  deleteWarehouseApi,
} from '../../api/warehouses.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Plus, Edit2, Trash2, Warehouse as WarehouseIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required').max(100),
  shortCode: z
    .string()
    .trim()
    .min(1, 'Short code is required')
    .max(10)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9_-]+$/.test(v), {
      message: 'Short code may only contain uppercase letters, numbers, and hyphens',
    }),
  address: z.string().trim().optional(),
  defaultLocationId: z.string().uuid().optional().nullable().or(z.literal('')),
});

export function WarehousesPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    data: warehouses = [],
    loading,
    refetch,
  } = useFetch(() => listWarehousesApi({ search }), [search]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(warehouseSchema),
  });

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setServerError('');
    reset({ name: '', shortCode: '', address: '', defaultLocationId: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (w) => {
    setEditingWarehouse(w);
    setServerError('');
    reset({
      name: w.name,
      shortCode: w.shortCode,
      address: w.address || '',
      defaultLocationId: w.defaultLocationId || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        ...data,
        defaultLocationId: data.defaultLocationId || null,
      };

      if (editingWarehouse) {
        await updateWarehouseApi(editingWarehouse.id, payload);
        toast.success(`Warehouse "${data.name}" updated successfully`);
      } else {
        await createWarehouseApi(payload);
        toast.success(`Warehouse "${data.name}" created with default Stock location`);
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
      await deleteWarehouseApi(deleteTarget.id);
      toast.success(`Warehouse "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not delete warehouse');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'shortCode',
      header: 'Code',
      className: 'w-24',
      render: (w) => (
        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
          {w.shortCode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Warehouse Name',
      render: (w) => (
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{w.name}</div>
          {w.address && <div className="text-xs text-zinc-500 truncate max-w-xs">{w.address}</div>}
        </div>
      ),
    },
    {
      key: 'defaultLocation',
      header: 'Default Location',
      render: (w) => (
        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          {w.defaultLocation ? `${w.shortCode}/${w.defaultLocation.shortCode}` : 'None'}
        </span>
      ),
    },
    {
      key: 'locationCount',
      header: 'Locations',
      className: 'w-28 text-center',
      render: (w) => (
        <Badge variant="zinc">
          {w.locationCount ?? 0} location{w.locationCount === 1 ? '' : 's'}
        </Badge>
      ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-20 text-right',
            render: (w) => (
              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(w)}
                  title="Edit warehouse"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(w)}
                  title="Delete warehouse"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        subtitle="Manage physical storage warehouses and default locations."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }, { label: 'Warehouses' }]}
        actions={
          canEdit && (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              New Warehouse
            </Button>
          )
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search warehouses by name or code..."
        />
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        loading={loading}
        onRowClick={canEdit ? handleOpenEdit : undefined}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse: ${editingWarehouse.name}` : 'New Warehouse'}
        description="Enter warehouse parameters. A default Stock location will be initialized automatically."
      >
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form id="warehouse-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Warehouse Name" error={errors.name?.message} required>
            <Input
              {...register('name')}
              placeholder="e.g. Main Distribution Center"
              icon={<WarehouseIcon className="w-4 h-4" />}
              autoFocus
            />
          </FormField>

          <FormField
            label="Short Code"
            error={errors.shortCode?.message}
            hint="Uppercase, unique prefix used in document references (e.g. WH)"
            required
          >
            <Input
              {...register('shortCode')}
              placeholder="e.g. WH"
              disabled={Boolean(editingWarehouse)}
            />
          </FormField>

          <FormField label="Street Address / Location" error={errors.address?.message}>
            <Textarea
              {...register('address')}
              placeholder="Physical street address, industrial zone, city, state..."
              rows={2}
            />
          </FormField>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
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
        title="Delete Warehouse"
        message={`Are you sure you want to delete warehouse "${deleteTarget?.name}"? Deletion will be rejected if any physical stock or active operations are assigned to it.`}
        confirmText="Delete Warehouse"
      />
    </div>
  );
}
