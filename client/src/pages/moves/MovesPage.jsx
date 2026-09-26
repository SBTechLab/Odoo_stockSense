import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { History } from 'lucide-react';

export function MovesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Move History"
        subtitle="Immutable ledger of all physical inventory movements."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Move History' }]}
      />
      <EmptyState
        icon={<History className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Double-entry stock ledger table with green/red movement highlights being built by Member 3."
      />
    </div>
  );
}
