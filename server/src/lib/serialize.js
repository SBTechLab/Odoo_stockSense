/**
 * Recursively convert Prisma Decimal values to plain numbers. Dates are kept
 * (JSON.stringify turns them into ISO strings). Applied automatically by `ok()`.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function serialize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  // Prisma.Decimal (decimal.js) — duck-typed so we do not depend on class identity.
  if (typeof value.toNumber === 'function' && typeof value.toFixed === 'function') {
    return value.toNumber();
  }
  if (Array.isArray(value)) return value.map(serialize);
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
  return out;
}

/**
 * Convert anything Decimal-like (Decimal | string | number | null) to a number.
 * @param {unknown} value
 * @returns {number}
 */
export function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

/**
 * Send the success envelope: { success: true, data, meta? }.
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {{ status?: number, meta?: object }} [opts]
 */
export function ok(res, data, { status = 200, meta } = {}) {
  const body = { success: true, data: serialize(data) };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
