import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../constants/routes.js';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in-50 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center mb-5 shadow-2xs">
        <ShieldX className="w-8 h-8 text-rose-600 dark:text-rose-400" />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">
        403 Forbidden
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
        Access Denied
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2 mb-8 leading-relaxed">
        You do not have the required permissions or administrative privileges to view this section. Please contact your system administrator if you believe this is in error.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary" icon={<Home className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
