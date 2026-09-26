import { Outlet, Link } from 'react-router';
import { Boxes, ShieldCheck, Zap, Layers } from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Left side: Hero banner (visible on md+) */}
      <div className="hidden md:flex md:w-1/2 bg-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-teal-700/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-teal-800/40 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to={ROUTES.LOGIN} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Boxes className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">StockSense</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Real-time, double-entry inventory control built for operational speed.
          </h2>
          <p className="text-sm text-teal-100/80 leading-relaxed">
            Eliminate manual registers and spreadsheet errors. Track incoming receipts, physical transfers, customer deliveries, and immutable ledger moves in one unified platform.
          </p>

          <div className="pt-4 grid grid-cols-1 gap-3.5 text-xs text-teal-200">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Instant stock updates via Server-Sent Events</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Multi-warehouse & multi-location topology</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Double-entry ledger with zero negative stock</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-teal-300/60">
          © 2026 StockSense Systems. All rights reserved.
        </div>
      </div>

      {/* Right side: Form container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
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
