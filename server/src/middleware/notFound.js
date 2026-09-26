import { NotFoundError } from '../lib/errors.js';

/** Catch-all for unknown routes. */
export function notFound(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
