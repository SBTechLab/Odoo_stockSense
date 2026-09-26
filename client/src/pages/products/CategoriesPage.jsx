import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Layers } from 'lucide-react';

export function CategoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle="Organize items into functional taxonomy trees."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Categories' }]}
      />
      <EmptyState
        icon={<Layers className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Category management view being built by Member 3."
      />
    </div>
  );
}
