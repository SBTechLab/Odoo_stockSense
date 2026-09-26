import { Navigate } from 'react-router';
import { ROUTES } from '../../constants/routes.js';

export function ResetPasswordPage() {
  return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;
}
