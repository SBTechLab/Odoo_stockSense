import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { BarChart3 } from 'lucide-react';

export function StockPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Overview"
        subtitle="Current physical balances and free-to-use availability across warehouses."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Stock' }]}
      />
      <EmptyState
        icon={<BarChart3 className="w-8 h-8 text-teal-600" />}
        title="Coming soon — built by Member 3"
        description="Real-time stock valuation table and location breakdown being built by Member 3."
      />
    </div>
  );
}
