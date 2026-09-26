import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { ROUTES } from '../constants/routes.js';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in-50 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 ring-1 ring-zinc-200 dark:ring-zinc-700/60 flex items-center justify-center mb-5 shadow-2xs">
        <FileQuestion className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">
        404 Error
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-2 mb-8 leading-relaxed">
        The inventory resource, shipment reference, or document you are attempting to access does not exist or has been relocated.
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
