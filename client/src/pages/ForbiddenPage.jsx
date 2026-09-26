import { Link } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { ShieldX, Home } from 'lucide-react';
import { ROUTES } from '../constants/routes.js';

export function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mb-4">
        <ShieldX className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">403</h1>
      <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Access Denied</h2>
      <p className="text-sm text-zinc-500 max-w-sm mt-1 mb-6">
        You do not have administrative privileges to view this section. Please contact your system administrator.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
