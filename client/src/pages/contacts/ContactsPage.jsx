import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Users } from 'lucide-react';

export function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts & Vendors"
        subtitle="Manage supplier and customer contact directories."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contacts' }]}
      />
      <EmptyState
        icon={<Users className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Vendor and Customer directory with GSTIN tracking being built by Member 2."
      />
    </div>
  );
}
