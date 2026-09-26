import { Link } from 'react-router';
import { Button } from '../components/ui/Button.jsx';
import { Home, FileQuestion } from 'lucide-react';
import { ROUTES } from '../constants/routes.js';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">404</h1>
      <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Page Not Found</h2>
      <p className="text-sm text-zinc-500 max-w-sm mt-1 mb-6">
        The inventory resource or document you are attempting to access does not exist or has been relocated.
      </p>
      <Link to={ROUTES.DASHBOARD}>
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
