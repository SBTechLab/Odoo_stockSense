import { useParams } from 'react-router';
import { OperationForm } from '../../components/operations/OperationForm.jsx';

export function TransferFormPage() {
  const { id } = useParams();

  return (
    <OperationForm
      type="INTERNAL"
      operationId={id || null}
      baseRoute="/operations/transfers"
    />
  );
}
