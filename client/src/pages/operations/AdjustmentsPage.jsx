import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Adjustments"
        subtitle="Record physical cycle counts and scrap write-offs."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: 'Adjustments' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Inventory adjustments ledger and quick counter being built by Member 2."
      />
    </div>
  );
}
