import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function ReceiptFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipt Document"
        subtitle="Manage product lines, validation, and print slips."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Receipts', href: '/operations/receipts' }, { label: 'Detail' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Receipt form page with status progression (Draft > Ready > Done) is being implemented by Member 2."
      />
    </div>
  );
}
