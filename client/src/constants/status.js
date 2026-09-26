export const OPERATION_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  WAITING: 'WAITING',
  READY: 'READY',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
});

export const OPERATION_STATUS_CONFIG = Object.freeze({
  DRAFT: {
    label: 'Draft',
    badgeClass: 'bg-zinc-100/80 text-zinc-700 ring-1 ring-zinc-600/20 dark:bg-zinc-800/60 dark:text-zinc-300 dark:ring-zinc-700/60',
    dotClass: 'bg-zinc-400 dark:bg-zinc-500',
  },
  WAITING: {
    label: 'Waiting',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  READY: {
    label: 'Ready',
    badgeClass: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-500/30',
    dotClass: 'bg-sky-500',
  },
  DONE: {
    label: 'Done',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  CANCELED: {
    label: 'Canceled',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500/30',
    dotClass: 'bg-rose-500',
  },
});

export const OPERATION_TYPES = Object.freeze({
  RECEIPT: 'RECEIPT',
  DELIVERY: 'DELIVERY',
  INTERNAL: 'INTERNAL',
  ADJUSTMENT: 'ADJUSTMENT',
});

export const OPERATION_TYPE_CONFIG = Object.freeze({
  RECEIPT: {
    label: 'Receipt',
    prefix: 'IN',
    colorClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30',
    direction: 'IN',
  },
  DELIVERY: {
    label: 'Delivery Order',
    prefix: 'OUT',
    colorClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500/30',
    direction: 'OUT',
  },
  INTERNAL: {
    label: 'Internal Transfer',
    prefix: 'INT',
    colorClass: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-500/30',
    direction: 'INT',
  },
  ADJUSTMENT: {
    label: 'Inventory Adjustment',
    prefix: 'ADJ',
    colorClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30',
    direction: 'ADJ',
  },
});

export const LOCATION_TYPES = Object.freeze({
  INTERNAL: 'INTERNAL',
  VENDOR: 'VENDOR',
  CUSTOMER: 'CUSTOMER',
  ADJUSTMENT: 'ADJUSTMENT',
});

export const LOCATION_TYPE_CONFIG = Object.freeze({
  INTERNAL: {
    label: 'Internal Location',
    color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-600/20 dark:ring-teal-500/30',
  },
  VENDOR: {
    label: 'Vendor (Virtual)',
    color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 ring-1 ring-purple-600/20 dark:ring-purple-500/30',
  },
  CUSTOMER: {
    label: 'Customer (Virtual)',
    color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-600/20 dark:ring-blue-500/30',
  },
  ADJUSTMENT: {
    label: 'Adjustment (Virtual)',
    color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-600/20 dark:ring-amber-500/30',
  },
});
