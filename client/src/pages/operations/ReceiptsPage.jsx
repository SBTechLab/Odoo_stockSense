import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ArrowDownLeft, Construction } from 'lucide-react';

export function ReceiptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Receipts"
        subtitle="Receive products from suppliers into warehouse stock."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: 'Receipts' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Receipts list view with Status pipeline, Kanban board, and Vendor linkage is being implemented by Member 2."
      />
    </div>
  );
}
