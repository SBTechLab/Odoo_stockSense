import { ZodError } from 'zod';
import { Prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

/** Turn a ZodError into [{ path, message }] for the client (field-level messages). */
function zodDetails(err) {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

/**
 * Last middleware in the chain. Maps every error to the envelope
 * { success: false, error: { code, message, details? } }.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    details = zodDetails(err);
    message = details[0]?.message ?? 'Validation failed';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target ?? err.meta?.driverAdapterError?.cause?.constraint?.fields;
      const fields = Array.isArray(target) ? target : target ? [String(target)] : [];
      const field = fields.filter((f) => f !== 'warehouseId').at(-1) ?? fields[0] ?? 'value';
      status = 409;
      code = 'CONFLICT';
      message = `A record with this ${field} already exists`;
      details = [{ path: field, message }];
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    } else if (err.code === 'P2003') {
      status = 409;
      code = 'CONFLICT';
      message = 'This record is referenced by other data';
    }
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    code = 'BAD_JSON';
    message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body too large';
  }

  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  const body = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  if (status >= 500 && env.isDev) body.error.stack = err?.stack;
  res.status(status).json(body);
}
