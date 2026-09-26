import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Orders"
        subtitle="Manage outgoing customer shipments and reservations."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Operations' }, { label: 'Deliveries' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Delivery orders list and Kanban view being built by Member 2."
      />
    </div>
  );
}
