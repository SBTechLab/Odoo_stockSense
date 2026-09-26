import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  listContactsApi,
  createContactApi,
  updateContactApi,
  deleteContactApi,
} from '../../api/contacts.js';
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
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Plus, Edit2, Trash2, Users, Building2, Phone, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';

const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  type: z.enum(['VENDOR', 'CUSTOMER', 'BOTH'], { error: 'Please select a contact type' }),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a 10-digit Indian phone number starting with 6-9')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(500, 'Address cannot exceed 500 characters').optional().or(z.literal('')),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (e.g. 24AAAAA0000A1Z5)')
    .optional()
    .or(z.literal('')),
});

const TYPE_CONFIG = {
  VENDOR: { label: 'Vendor', color: 'amber' },
  CUSTOMER: { label: 'Customer', color: 'sky' },
  BOTH: { label: 'Vendor & Customer', color: 'violet' },
};

export function ContactsPage() {
  const { hasRole } = useAuth();
  const canDelete = hasRole('ADMIN', 'MANAGER');

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const typeParam = activeTab === 'ALL' ? undefined : activeTab;

  const {
    data,
    loading,
    error,
    refetch,
  } = useFetch(
    () => listContactsApi({ type: typeParam, search }),
    [activeTab, search]
  );

  const contacts = data?.data || (Array.isArray(data) ? data : []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      type: 'BOTH',
      email: '',
      phone: '',
      address: '',
      gstin: '',
    },
  });

  const handleOpenCreate = () => {
    setEditingContact(null);
    setServerError('');
    reset({
      name: '',
      type: activeTab === 'VENDOR' ? 'VENDOR' : activeTab === 'CUSTOMER' ? 'CUSTOMER' : 'BOTH',
      email: '',
      phone: '',
      address: '',
      gstin: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setServerError('');
    reset({
      name: contact.name,
      type: contact.type,
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      gstin: contact.gstin || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        gstin: formData.gstin?.trim() || null,
      };

      if (editingContact) {
        await updateContactApi(editingContact.id, payload);
        toast.success(`Contact "${formData.name}" updated successfully`);
      } else {
        await createContactApi(payload);
        toast.success(`Contact "${formData.name}" created successfully`);
      }

      setModalOpen(false);
      refetch();
    } catch (err) {
      setServerError(err.message || 'Failed to save contact');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteContactApi(deleteTarget.id);
      toast.success(`Contact "${deleteTarget.name}" deactivated`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate contact');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Contact Name',
      render: (row) => (
        <div className="flex items-start gap-3 py-1">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center shrink-0 text-teal-700 dark:text-teal-400 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
            {row.address && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-sm mt-0.5">
                {row.address}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const conf = TYPE_CONFIG[row.type] || { label: row.type, color: 'zinc' };
        return <Badge color={conf.color}>{conf.label}</Badge>;
      },
    },
    {
      key: 'contactInfo',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          {row.phone && (
            <div className="flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[180px]">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && <span className="text-zinc-400">—</span>}
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      render: (row) =>
        row.gstin ? (
          <span className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
            {row.gstin}
          </span>
        ) : (
          <span className="text-zinc-400 text-xs">—</span>
        ),
    },
    {
      key: 'operations',
      header: 'Operations',
      render: (row) => (
        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
          {row._count?.operations ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            aria-label="Edit contact"
            className="h-8 w-8 p-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(row)}
              aria-label="Delete contact"
              className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts & Directory"
        subtitle="Manage supplier and customer contact details, tax identifiers, and addresses."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contacts' }]}
        actions={
          <Button variant="primary" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
            New Contact
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'All Contacts' },
            { id: 'VENDOR', label: 'Vendors' },
            { id: 'CUSTOMER', label: 'Customers' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, phone..."
          />
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Failed to load contacts"
          message={error.message}
          onRetry={refetch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Users className="w-8 h-8 text-teal-600" />}
              title="No contacts found"
              description={
                search
                  ? `No contacts matching "${search}" were found.`
                  : 'Add your first supplier or customer contact to link to receipts and deliveries.'
              }
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Contact
                </Button>
              }
            />
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingContact ? 'Edit Contact' : 'New Contact'}
        description="Provide vendor or customer contact information, tax GSTIN, and default shipping addresses."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name / Company Name" required error={errors.name?.message} className="sm:col-span-2">
              <Input
                {...register('name')}
                placeholder="e.g. Acme Industrial Supplies Ltd"
                error={Boolean(errors.name)}
                autoFocus
              />
            </FormField>

            <FormField label="Contact Type" required error={errors.type?.message}>
              <Select {...register('type')} error={Boolean(errors.type)}>
                <option value="BOTH">Both (Vendor & Customer)</option>
                <option value="VENDOR">Vendor (Supplier)</option>
                <option value="CUSTOMER">Customer (Buyer)</option>
              </Select>
            </FormField>

            <FormField label="GSTIN (15 Digits)" error={errors.gstin?.message}>
              <Input
                {...register('gstin')}
                placeholder="24ABCDE1234F1Z5"
                className="uppercase font-mono text-xs"
                error={Boolean(errors.gstin)}
              />
            </FormField>

            <FormField label="Phone Number" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder="9876543210"
                className="font-mono"
                error={Boolean(errors.phone)}
              />
            </FormField>

            <FormField label="Email Address" error={errors.email?.message}>
              <Input
                {...register('email')}
                type="email"
                placeholder="orders@acme.com"
                error={Boolean(errors.email)}
              />
            </FormField>

            <FormField label="Physical / Shipping Address" error={errors.address?.message} className="sm:col-span-2">
              <Textarea
                {...register('address')}
                rows={3}
                placeholder="Plot No. 12, GIDC Estate, Vatva, Ahmedabad, Gujarat - 382445"
                error={Boolean(errors.address)}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {editingContact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Deactivate Contact"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? Historical operations linked to this contact will be preserved, but it will be hidden from new selections.`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}
