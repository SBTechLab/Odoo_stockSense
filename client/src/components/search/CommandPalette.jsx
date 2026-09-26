import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, X, Package, FileText, User, PlusCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { globalSearchApi } from '../../api/search.js';
import { useDebounce } from '../../hooks/useDebounce.js';

export function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);

  const [results, setResults] = useState({ products: [], operations: [], contacts: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const quickActions = [
    { title: 'New Goods Receipt', subtitle: 'Create inbound vendor shipment', link: '/operations/receipts/new', icon: <PlusCircle className="w-4 h-4 text-emerald-600" /> },
    { title: 'New Delivery Order', subtitle: 'Create outbound customer shipment', link: '/operations/deliveries/new', icon: <PlusCircle className="w-4 h-4 text-rose-600" /> },
    { title: 'Add New Product', subtitle: 'Create catalog item with optional initial stock', link: '/products/new', icon: <PlusCircle className="w-4 h-4 text-teal-600" /> },
    { title: 'Go to Stock Balances', subtitle: 'View real-time physical inventory per location', link: '/stock', icon: <ArrowRight className="w-4 h-4 text-zinc-400" /> },
    { title: 'Go to Replenishment', subtitle: 'Review low-stock reorder suggestions', link: '/replenishment', icon: <ArrowRight className="w-4 h-4 text-zinc-400" /> },
  ];

  const fetchSearchResults = async () => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults({ products: [], operations: [], contacts: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await globalSearchApi(debouncedQuery);
      setResults(res.data || { products: [], operations: [], contacts: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [debouncedQuery]);

  // Combine flat items for keyboard navigation
  const flatItems = query.trim().length >= 2
    ? [...results.products, ...results.operations, ...results.contacts]
    : quickActions;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatItems[selectedIndex];
      if (selected && selected.link) {
        onClose();
        navigate(selected.link);
      }
    }
  };

  const handleSelect = (item) => {
    onClose();
    navigate(item.link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in-0">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU, product name, reference, or contact... (Esc to close)"
            className="w-full text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200 dark:border-zinc-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {query.trim().length < 2 ? (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="space-y-1">
                {quickActions.map((action, idx) => (
                  <div
                    key={action.link}
                    onClick={() => handleSelect(action)}
                    className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      selectedIndex === idx
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 border border-teal-200/50 dark:border-teal-800/50'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {action.icon}
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-[11px] text-zinc-400">{action.subtitle}</div>
                      </div>
                    </div>
                    {selectedIndex === idx && <CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Searching index...</div>
          ) : flatItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No matching products, operations, or contacts found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-600" /> Products
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.products.map((item) => {
                      const itemIdx = flatItems.findIndex((i) => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedIndex === itemIdx
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 border border-teal-200/50 dark:border-teal-800/50'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
                            <div className="text-[11px] text-zinc-400">{item.subtitle}</div>
                          </div>
                          {selectedIndex === itemIdx && <CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Operations */}
              {results.operations?.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" /> Operations
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.operations.map((item) => {
                      const itemIdx = flatItems.findIndex((i) => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedIndex === itemIdx
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 border border-teal-200/50 dark:border-teal-800/50'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-teal-600 dark:text-teal-400">{item.title}</div>
                            <div className="text-[11px] text-zinc-400">{item.subtitle}</div>
                          </div>
                          {selectedIndex === itemIdx && <CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts */}
              {results.contacts?.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" /> Contacts
                  </div>
                  <div className="space-y-1 mt-1">
                    {results.contacts.map((item) => {
                      const itemIdx = flatItems.findIndex((i) => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            selectedIndex === itemIdx
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 border border-teal-200/50 dark:border-teal-800/50'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
                            <div className="text-[11px] text-zinc-400">{item.subtitle}</div>
                          </div>
                          {selectedIndex === itemIdx && <CornerDownLeft className="w-3.5 h-3.5 text-teal-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            Use <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-[10px]">↑</kbd>{' '}
            <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-[10px]">↓</kbd> to navigate,{' '}
            <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-[10px]">↵</kbd> to select
          </span>
          <span>StockSense Search Index</span>
        </div>
      </div>
    </div>
  );
}
