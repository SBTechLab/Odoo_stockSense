/**
 * Typed application errors. Throw these from services; errorHandler turns
 * them into the standard envelope: { success: false, error: { code, message, details? } }.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string, details?: unknown }} [opts]
   */
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, { status: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { status: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details) {
    super(message, { status: 409, code: 'CONFLICT', details });
  }
}

/**
 * Thrown when an operation would drive stock negative.
 * details: [{ lineId?, productId, required, available, shortBy }]
 */
export class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock', details = []) {
    super(message, { status: 409, code: 'INSUFFICIENT_STOCK', details });
  }
}

/** Thrown when an action is not allowed in the current status (e.g. validating a DRAFT). */
export class InvalidStateError extends AppError {
  constructor(message = 'Action not allowed in the current state', details) {
    super(message, { status: 409, code: 'INVALID_STATE', details });
  }
}
