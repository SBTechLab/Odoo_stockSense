import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Package } from 'lucide-react';

export function ProductFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Details"
        subtitle="Manage product attributes, reorder rules, and location stock."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Detail' }]}
      />
      <EmptyState
        icon={<Package className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Product form and ledger history being built by Member 3."
      />
    </div>
  );
}
