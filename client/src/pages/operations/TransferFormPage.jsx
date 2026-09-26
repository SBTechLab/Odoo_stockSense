import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function TransferFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Transfer Document"
        subtitle="Execute inventory transfer between internal locations."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Transfers', href: '/operations/transfers' }, { label: 'Detail' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Internal transfer document form being built by Member 2."
      />
    </div>
  );
}
