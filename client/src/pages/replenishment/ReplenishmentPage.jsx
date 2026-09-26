import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { RefreshCw } from 'lucide-react';

export function ReplenishmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Replenishment"
        subtitle="Automated reordering suggestions based on minimum quantity rules."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Replenishment' }]}
      />
      <EmptyState
        icon={<RefreshCw className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Automated reorder triggers and 1-click draft receipt generator being built by Member 3."
      />
    </div>
  );
}
