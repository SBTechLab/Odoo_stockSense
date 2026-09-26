import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Operational metrics, stock valuation, and activity trends."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
      />
      <EmptyState
        icon={<LayoutDashboard className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="KPI summary cards (to receive, late operations, to deliver, waiting for stock) and trends are being implemented by Member 3."
      />
    </div>
  );
}
