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
        className: 'rounded-xl border shadow-lg font-sans text-xs',
      }}
    />
  );
}
