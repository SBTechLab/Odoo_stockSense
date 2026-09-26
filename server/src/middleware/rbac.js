import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

export const ROLES = Object.freeze({ ADMIN: 'ADMIN', MANAGER: 'MANAGER', STAFF: 'STAFF' });

/**
 * Shorthand role groups used by routers.
 *  - ADMIN:   everything.
 *  - MANAGER: everything except user management.
 *  - STAFF:   view all; create/edit/confirm/validate receipts, deliveries, transfers;
 *             submit adjustments. No deletes, no master-data edits, no cancel.
 */
export const CAN = Object.freeze({
  /** User management. */
  MANAGE_USERS: [ROLES.ADMIN],
  /** Master data: products, categories, warehouses, locations, contacts, reorder rules. */
  MANAGE_MASTER_DATA: [ROLES.ADMIN, ROLES.MANAGER],
  /** Deletes of any kind. */
  DELETE: [ROLES.ADMIN, ROLES.MANAGER],
  /** Cancel an operation. */
  CANCEL_OPERATION: [ROLES.ADMIN, ROLES.MANAGER],
  /** Create/edit/confirm/validate receipts, deliveries, transfers; submit adjustments. */
  OPERATE: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  /** Any authenticated user. */
  VIEW: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
});

/**
 * Allow the request only if `req.user.role` is one of `roles`.
 * Must run after `requireAuth`.
 *
 * @param {...string|string[]} roles e.g. requireRole('ADMIN') or requireRole(...CAN.DELETE)
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...roles) {
  const allowed = new Set(roles.flat());
  return (req, _res, next) => {
    if (!req.user) throw new UnauthorizedError();
    if (!allowed.has(req.user.role)) throw new ForbiddenError();
    next();
  };
}
