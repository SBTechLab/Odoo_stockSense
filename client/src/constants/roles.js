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
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  STAFF: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
});
