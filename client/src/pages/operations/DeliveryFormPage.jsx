import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function DeliveryFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Order Document"
        subtitle="Manage customer shipments, reservations, and stock validation."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Deliveries', href: '/operations/deliveries' }, { label: 'Detail' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Delivery order form (Draft > Waiting > Ready > Done) being built by Member 2."
      />
    </div>
  );
}
