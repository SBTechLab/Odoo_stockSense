import { OperationListPage } from '../../components/operations/OperationListPage.jsx';

export function DeliveriesPage() {
  return (
    <OperationListPage
      type="DELIVERY"
      title="Delivery Orders"
      subtitle="Fulfill customer orders, check product availability, and ship stock out."
      baseRoute="/operations/deliveries"
    />
  );
}
