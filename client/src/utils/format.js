/**
 * Currency formatter for Indian Rupees (₹) in en-IN locale.
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0.00';
  const val = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
}

/**
 * Number formatter with en-IN separators and configurable decimals.
 * @param {number|string|null|undefined} num
 * @param {number} [decimals=0]
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  const val = Number(num);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

/**
 * Format date string e.g. "26 Sep 2026".
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time e.g. "26 Sep 2026, 10:30 AM".
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format relative time (e.g. "5m ago", "2h ago", "yesterday").
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(date);
}
