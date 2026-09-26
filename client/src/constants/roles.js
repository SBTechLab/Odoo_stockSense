export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
});

export const ROLE_LABELS = Object.freeze({
  ADMIN: 'Administrator',
  MANAGER: 'Inventory Manager',
  STAFF: 'Warehouse Staff',
});

export const ROLE_COLORS = Object.freeze({
  ADMIN: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-600/20 dark:ring-purple-500/30',
  MANAGER: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-600/20 dark:ring-blue-500/30',
  STAFF: 'bg-zinc-100/80 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 ring-1 ring-zinc-600/20 dark:ring-zinc-700/60',
});
