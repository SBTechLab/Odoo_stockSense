import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Construction } from 'lucide-react';

export function AdjustmentFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Inventory Count"
        subtitle="Count physical inventory and auto-adjust theoretical differences."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Adjustments', href: '/operations/adjustments' }, { label: 'New' }]}
      />
      <EmptyState
        icon={<Construction className="w-8 h-8 text-amber-500" />}
        title="Coming soon — built by Member 2"
        description="Physical count form being built by Member 2."
      />
    </div>
  );
}
