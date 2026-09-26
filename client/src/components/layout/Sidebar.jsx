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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES } from '../../constants/routes.js';
import { ROLE_COLORS } from '../../constants/roles.js';

export function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout, hasRole } = useAuth();

  const navigation = [
    {
      label: null,
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
      label: 'PRODUCTS',
      items: [
        { name: 'Products', href: ROUTES.PRODUCTS, icon: Package },
        { name: 'Categories', href: ROUTES.CATEGORIES, icon: Layers },
        { name: 'Stock Overview', href: ROUTES.STOCK, icon: BarChart3 },
        { name: 'Replenishment', href: ROUTES.REPLENISHMENT, icon: RefreshCw },
      ],
    },
    {
      label: null,
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

  const content = (
    <aside className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-5 border-b border-zinc-200 dark:border-zinc-800">
        <NavLink to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 font-bold text-base text-zinc-900 dark:text-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <span>StockSense</span>
        </NavLink>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Link Tree */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <h4 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {section.label}
              </h4>
            )}
            <nav className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Profile Menu at the bottom */}
      {user && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
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
          </div>

          <div className="space-y-0.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <NavLink
              to={ROUTES.PROFILE}
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>My Profile</span>
            </NavLink>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <div className="hidden md:flex shrink-0">{content}</div>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-300">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
