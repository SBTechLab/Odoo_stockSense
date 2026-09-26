import { Outlet, Link } from 'react-router';
import { Boxes, ShieldCheck, Zap, Layers, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Left side: Hero banner (visible on md+) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-teal-950 via-teal-900 to-zinc-950 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden select-none border-r border-teal-900/60">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-teal-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform shadow-2xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-tight">StockSense</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-300/70">Inventory Intelligence</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/40 border border-teal-700/40 text-xs font-medium text-teal-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Enterprise Inventory Platform</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Real-time, double-entry inventory control built for operational speed.
          </h2>
          <p className="text-sm lg:text-base text-teal-100/80 leading-relaxed font-normal">
            Eliminate manual registers and spreadsheet errors. Track incoming receipts, physical transfers, customer deliveries, and immutable ledger moves in one unified platform.
          </p>

          <div className="pt-4 grid grid-cols-1 gap-3.5 text-xs text-teal-200">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-teal-800/50 flex items-center justify-center text-teal-300 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Instant stock updates via Server-Sent Events</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-teal-800/50 flex items-center justify-center text-teal-300 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>Multi-warehouse & multi-location topology</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-teal-800/50 flex items-center justify-center text-teal-300 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Double-entry ledger with zero negative stock</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-teal-300/60 pt-6 border-t border-teal-800/40">
          <span>© 2026 StockSense Systems</span>
          <span className="flex items-center gap-1.5 text-teal-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Production Grade v1.0</span>
          </span>
        </div>
      </div>

      {/* Right side: Form container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-2xs">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">StockSense</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
