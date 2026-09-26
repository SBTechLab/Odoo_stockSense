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
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    dotClass: 'bg-zinc-400',
  },
  WAITING: {
    label: 'Waiting',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  READY: {
    label: 'Ready',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  },
  DONE: {
    label: 'Done',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  CANCELED: {
    label: 'Canceled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
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
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    direction: 'IN',
  },
  DELIVERY: {
    label: 'Delivery Order',
    prefix: 'OUT',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    direction: 'OUT',
  },
  INTERNAL: {
    label: 'Internal Transfer',
    prefix: 'INT',
    colorClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    direction: 'INT',
  },
  ADJUSTMENT: {
    label: 'Inventory Adjustment',
    prefix: 'ADJ',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
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
  INTERNAL: { label: 'Internal Location', color: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' },
  VENDOR: { label: 'Vendor (Virtual)', color: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  CUSTOMER: { label: 'Customer (Virtual)', color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  ADJUSTMENT: { label: 'Adjustment (Virtual)', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
});
