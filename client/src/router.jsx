import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuth } from './context/AuthContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { AuthLayout } from './components/layout/AuthLayout.jsx';
import { Spinner } from './components/ui/Spinner.jsx';

// Auth Pages (Member 1)
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { SignupPage } from './pages/auth/SignupPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { ProfilePage } from './pages/profile/ProfilePage.jsx';

// Settings & Admin Pages (Member 1)
import { WarehousesPage } from './pages/settings/WarehousesPage.jsx';
import { LocationsPage } from './pages/settings/LocationsPage.jsx';
import { UsersPage } from './pages/settings/UsersPage.jsx';
import { ActivityPage } from './pages/settings/ActivityPage.jsx';

// Operations & Contacts Pages (Member 2 Placeholders)
import { ReceiptsPage } from './pages/operations/ReceiptsPage.jsx';
import { ReceiptFormPage } from './pages/operations/ReceiptFormPage.jsx';
import { DeliveriesPage } from './pages/operations/DeliveriesPage.jsx';
import { DeliveryFormPage } from './pages/operations/DeliveryFormPage.jsx';
import { TransfersPage } from './pages/operations/TransfersPage.jsx';
import { TransferFormPage } from './pages/operations/TransferFormPage.jsx';
import { AdjustmentsPage } from './pages/operations/AdjustmentsPage.jsx';
import { AdjustmentFormPage } from './pages/operations/AdjustmentFormPage.jsx';
import { PrintSlipPage } from './pages/operations/PrintSlipPage.jsx';
import { ContactsPage } from './pages/contacts/ContactsPage.jsx';

// Products & Dashboard Pages (Member 3 Placeholders)
import { DashboardPage } from './pages/dashboard/DashboardPage.jsx';
import { ProductsPage } from './pages/products/ProductsPage.jsx';
import { ProductFormPage } from './pages/products/ProductFormPage.jsx';
import { CategoriesPage } from './pages/products/CategoriesPage.jsx';
import { StockPage } from './pages/stock/StockPage.jsx';
import { MovesPage } from './pages/moves/MovesPage.jsx';
import { ReplenishmentPage } from './pages/replenishment/ReplenishmentPage.jsx';

// Error Pages
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { ForbiddenPage } from './pages/ForbiddenPage.jsx';

/**
 * Route protection wrapper. Checks auth session and optional role requirements.
 */
function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (requiredRoles && !hasRole(...requiredRoles)) {
    return <ForbiddenPage />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Standalone Print Slip (No Shell Layout) */}
      <Route
        path="/operations/:id/print"
        element={
          <ProtectedRoute>
            <PrintSlipPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Operations */}
        <Route path="/operations/receipts" element={<ReceiptsPage />} />
        <Route path="/operations/receipts/new" element={<ReceiptFormPage />} />
        <Route path="/operations/receipts/:id" element={<ReceiptFormPage />} />

        <Route path="/operations/deliveries" element={<DeliveriesPage />} />
        <Route path="/operations/deliveries/new" element={<DeliveryFormPage />} />
        <Route path="/operations/deliveries/:id" element={<DeliveryFormPage />} />

        <Route path="/operations/transfers" element={<TransfersPage />} />
        <Route path="/operations/transfers/new" element={<TransferFormPage />} />
        <Route path="/operations/transfers/:id" element={<TransferFormPage />} />

        <Route path="/operations/adjustments" element={<AdjustmentsPage />} />
        <Route path="/operations/adjustments/new" element={<AdjustmentFormPage />} />
        <Route path="/operations/adjustments/:id" element={<AdjustmentFormPage />} />

        {/* Catalog, Stock & Ledger */}
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        <Route path="/products/categories" element={<CategoriesPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/replenishment" element={<ReplenishmentPage />} />
        <Route path="/moves" element={<MovesPage />} />

        {/* Settings & Admin */}
        <Route path="/settings/warehouses" element={<WarehousesPage />} />
        <Route path="/settings/locations" element={<LocationsPage />} />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute requiredRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 403 & 404 */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
