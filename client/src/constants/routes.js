export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Operations
  OPERATIONS_RECEIPTS: '/operations/receipts',
  OPERATIONS_RECEIPTS_NEW: '/operations/receipts/new',
  OPERATIONS_RECEIPTS_DETAIL: (id = ':id') => `/operations/receipts/${id}`,

  OPERATIONS_DELIVERIES: '/operations/deliveries',
  OPERATIONS_DELIVERIES_NEW: '/operations/deliveries/new',
  OPERATIONS_DELIVERIES_DETAIL: (id = ':id') => `/operations/deliveries/${id}`,

  OPERATIONS_TRANSFERS: '/operations/transfers',
  OPERATIONS_TRANSFERS_NEW: '/operations/transfers/new',
  OPERATIONS_TRANSFERS_DETAIL: (id = ':id') => `/operations/transfers/${id}`,

  OPERATIONS_ADJUSTMENTS: '/operations/adjustments',
  OPERATIONS_ADJUSTMENTS_NEW: '/operations/adjustments/new',
  OPERATIONS_ADJUSTMENTS_DETAIL: (id = ':id') => `/operations/adjustments/${id}`,

  OPERATIONS_PRINT: (id = ':id') => `/operations/${id}/print`,

  // Master Data & Stock
  CONTACTS: '/contacts',
  PRODUCTS: '/products',
  PRODUCTS_NEW: '/products/new',
  PRODUCTS_DETAIL: (id = ':id') => `/products/${id}`,
  CATEGORIES: '/products/categories',
  STOCK: '/stock',
  REPLENISHMENT: '/replenishment',
  MOVES: '/moves',

  // Settings
  SETTINGS_WAREHOUSES: '/settings/warehouses',
  SETTINGS_LOCATIONS: '/settings/locations',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_ACTIVITY: '/settings/activity',
});
