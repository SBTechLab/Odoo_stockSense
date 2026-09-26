import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('stocksense-theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const isDarkSystem = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    return theme === 'dark' || (theme === 'system' && isDarkSystem) ? 'dark' : 'light';
  });

  const applyTheme = useCallback((targetTheme) => {
    const isDark =
      targetTheme === 'dark' ||
      (targetTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      setResolvedTheme('light');
    }
  }, []);

  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('stocksense-theme', newTheme);
      } catch {
        // ignore
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery?.addEventListener?.('change', handleChange);
    return () => mediaQuery?.removeEventListener?.('change', handleChange);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
