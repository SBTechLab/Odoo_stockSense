import { OperationListPage } from '../../components/operations/OperationListPage.jsx';

export function ReceiptsPage() {
  return (
    <OperationListPage
      type="RECEIPT"
      title="Incoming Receipts"
      subtitle="Receive goods from suppliers and vendors into warehouse inventory."
      baseRoute="/operations/receipts"
    />
  );
}
