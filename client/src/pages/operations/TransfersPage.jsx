import { OperationListPage } from '../../components/operations/OperationListPage.jsx';

export function TransfersPage() {
  return (
    <OperationListPage
      type="INTERNAL"
      title="Internal Transfers"
      subtitle="Relocate stock between racks, production floors, and warehouses."
      baseRoute="/operations/transfers"
    />
  );
}
