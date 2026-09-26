import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function TransfersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Transfers"
        subtitle="Relocate inventory between internal racks and warehouses."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: 'Transfers' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Internal transfers workflow being built by Member 2."
      />
    </div>
  );
}
