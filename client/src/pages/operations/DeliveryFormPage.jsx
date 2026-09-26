import { useParams } from 'react-router';
import { OperationForm } from '../../components/operations/OperationForm.jsx';

export function DeliveryFormPage() {
  const { id } = useParams();

  return (
    <OperationForm
      type="DELIVERY"
      operationId={id || null}
      baseRoute="/operations/deliveries"
    />
  );
}
