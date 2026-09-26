import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { CommandPalette } from '../search/CommandPalette.jsx';

export function Topbar({ onMobileMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-4 sm:px-6 backdrop-blur-md transition-colors select-none">
        {/* Left: Mobile hamburger & Search trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuClick}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Button (Input-styled) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="group flex items-center justify-between gap-3 w-48 sm:w-64 md:w-80 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-2xs min-h-[36px]"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0" />
              <span className="truncate">Search products, references...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Controls & Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Status Badge */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-2xs ring-1 ring-teal-500/20">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
}
