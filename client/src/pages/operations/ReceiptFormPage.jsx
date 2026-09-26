import { useParams } from 'react-router';
import { OperationForm } from '../../components/operations/OperationForm.jsx';

export function ReceiptFormPage() {
  const { id } = useParams();

  return (
    <OperationForm
      type="RECEIPT"
      operationId={id || null}
      baseRoute="/operations/receipts"
    />
  );
}
