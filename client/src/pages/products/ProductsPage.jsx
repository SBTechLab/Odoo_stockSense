import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Package } from 'lucide-react';

export function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage product catalog, SKUs, and per-location stock."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]}
      />
      <EmptyState
        icon={<Package className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Product catalog, barcode search, and CSV import/export being implemented by Member 3."
      />
    </div>
  );
}
