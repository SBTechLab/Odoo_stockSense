import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Standard spinner component.
 */
export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={clsx('animate-spin text-teal-600 dark:text-teal-400', sizes[size], className)}
    />
  );
}
