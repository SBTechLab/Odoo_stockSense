import { useState } from 'react';
import { NavLink } from 'react-router';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  Package,
  Layers,
  BarChart3,
  RefreshCw,
  History,
  Users,
  Warehouse,
  MapPin,
  ShieldCheck,
  Activity,
  User,
  LogOut,
  Boxes,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES } from '../../constants/routes.js';
import { ROLE_COLORS } from '../../constants/roles.js';
import { Tooltip } from '../ui/Tooltip.jsx';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('stocksense_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('stocksense_sidebar_collapsed', String(next));
      } catch (err) {
        console.warn('Could not persist sidebar collapsed state:', err);
      }
      return next;
    });
  };

  const navigation = [
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { name: 'Receipts', href: ROUTES.OPERATIONS_RECEIPTS, icon: ArrowDownLeft },
        { name: 'Deliveries', href: ROUTES.OPERATIONS_DELIVERIES, icon: ArrowUpRight },
        { name: 'Internal Transfers', href: ROUTES.OPERATIONS_TRANSFERS, icon: ArrowLeftRight },
        { name: 'Adjustments', href: ROUTES.OPERATIONS_ADJUSTMENTS, icon: Sliders },
      ],
    },
    {
      label: 'PRODUCTS & STOCK',
      items: [
        { name: 'Products', href: ROUTES.PRODUCTS, icon: Package },
        { name: 'Categories', href: ROUTES.CATEGORIES, icon: Layers },
        { name: 'Stock Overview', href: ROUTES.STOCK, icon: BarChart3 },
        { name: 'Replenishment', href: ROUTES.REPLENISHMENT, icon: RefreshCw },
      ],
    },
    {
      label: 'LEDGER',
      items: [
        { name: 'Move History', href: ROUTES.MOVES, icon: History },
        { name: 'Contacts', href: ROUTES.CONTACTS, icon: Users },
      ],
    },
    {
      label: 'SETTINGS',
      items: [
        { name: 'Warehouses', href: ROUTES.SETTINGS_WAREHOUSES, icon: Warehouse },
        { name: 'Locations', href: ROUTES.SETTINGS_LOCATIONS, icon: MapPin },
        ...(hasRole('ADMIN')
          ? [{ name: 'Users', href: ROUTES.SETTINGS_USERS, icon: ShieldCheck }]
          : []),
        { name: 'Activity Log', href: ROUTES.SETTINGS_ACTIVITY, icon: Activity },
      ],
    },
  ];

  const renderNavContent = (isMobile = false) => {
    const isRail = !isMobile && collapsed;

    return (
      <aside
        className={clsx(
          'flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 select-none transition-all duration-200',
          isRail ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            'flex items-center h-14 border-b border-zinc-200 dark:border-zinc-800 shrink-0',
            isRail ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'
          )}
        >
          <NavLink
            to={ROUTES.DASHBOARD}
            className="flex items-center gap-2.5 font-bold text-base text-zinc-900 dark:text-zinc-100 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            {!isRail && <span className="truncate tracking-tight font-semibold">StockSense</span>}
          </NavLink>

          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation drawer"
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 no-scrollbar">
          {navigation.map((section, idx) => (
            <div key={idx}>
              {section.label && !isRail && (
                <h4 className="px-2.5 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {section.label}
                </h4>
              )}
              {isRail && idx > 0 && (
                <div className="my-2 border-t border-zinc-100 dark:border-zinc-800" />
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const navLink = (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={isMobile ? onCloseMobile : undefined}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center rounded-lg text-xs font-medium transition-all group cursor-pointer',
                          isRail
                            ? 'justify-center w-10 h-10 mx-auto'
                            : 'gap-3 px-3 py-2 min-h-[40px] md:min-h-[36px]',
                          isActive
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        )
                      }
                    >
                      <item.icon
                        className={clsx(
                          'shrink-0 transition-transform group-hover:scale-105',
                          isRail ? 'w-5 h-5' : 'w-4 h-4'
                        )}
                      />
                      {!isRail && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  );

                  if (isRail) {
                    return (
                      <Tooltip key={item.href} content={item.name} position="right">
                        {navLink}
                      </Tooltip>
                    );
                  }

                  return navLink;
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Section: Profile + Collapse Toggle */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          {/* User Preview */}
          {user && (
            <div
              className={clsx(
                'flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-lg',
                isRail && 'justify-center p-1'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-2xs shrink-0 ring-1 ring-teal-500/30">
                {user.name?.charAt(0) || 'U'}
              </div>
              {!isRail && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.name}
                  </p>
                  <span
                    className={clsx(
                      'inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase tracking-wider',
                      ROLE_COLORS[user.role]
                    )}
                  >
                    {user.role}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* User Quick Actions */}
          {!isRail ? (
            <div className="space-y-0.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800">
              <NavLink
                to={ROUTES.PROFILE}
                onClick={isMobile ? onCloseMobile : undefined}
                className="flex items-center gap-2.5 px-3 py-2 min-h-[40px] md:min-h-[32px] text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>My Profile</span>
              </NavLink>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] md:min-h-[32px] text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
              <Tooltip content="My Profile" position="right">
                <NavLink
                  to={ROUTES.PROFILE}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                </NavLink>
              </Tooltip>

              <Tooltip content="Logout" position="right">
                <button
                  type="button"
                  onClick={logout}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Desktop Rail Toggle Button */}
          {!isMobile && (
            <div className="pt-2 mt-2 border-t border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={clsx(
                  'w-full flex items-center py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer',
                  isRail ? 'justify-center' : 'justify-between px-3'
                )}
              >
                {!isRail && <span>Collapse Sidebar</span>}
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden md:flex shrink-0">{renderNavContent(false)}</div>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-250">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
