import { useState, useEffect } from 'react';
import { Search, Command, X } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';

/**
 * Global Search / CommandPalette (Ctrl+K).
 * Member 3 hooks this to /api/search for global SKU & document search.
 */
export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <Search className="w-5 h-5 text-zinc-400 shrink-0" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by SKU, product name, reference, or contact... (Esc to close)"
          className="w-full text-base bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <Command className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Global search index ready — live search results populated by Member 3
      </div>
    </Modal>
  );
}
