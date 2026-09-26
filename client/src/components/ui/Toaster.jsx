import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * Standard Toast notification provider using Sonner.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-lg font-sans text-xs p-3.5',
        descriptionClassName: 'text-zinc-500 dark:text-zinc-400 mt-1',
      }}
    />
  );
}
