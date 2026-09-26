import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import {
  listCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from '../../api/categories.js';

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await listCategoriesApi({ search });
      setCategories(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      if (editingCategory) {
        await updateCategoryApi(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategoryApi(formData);
        toast.success('Category created successfully');
      }
      setModalOpen(false);
      fetchCategories();
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCategoryApi(deleteId);
      toast.success('Category deleted successfully');
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (row) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <span className="text-zinc-500 dark:text-zinc-400 text-xs">{row.description || '—'}</span>,
    },
    {
      key: 'productsCount',
      label: 'Products',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {row._count?.products ?? 0} active products
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle="Organize items into functional taxonomy groups."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Categories' }]}
        action={
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Add Category
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories..." className="max-w-xs" />
      </div>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyTitle="No categories found"
        emptyDescription="Create your first category to start organizing products."
        emptyIcon={<Layers className="w-8 h-8 text-teal-600" />}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description={editingCategory ? 'Update category name and description' : 'Add a new product taxonomy category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <FormField label="Category Name" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Raw Material, Electronics"
            />
          </FormField>
          <FormField label="Description" error={errors.description}>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of items in this category..."
              rows={3}
            />
          </FormField>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone if no products use this category."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
