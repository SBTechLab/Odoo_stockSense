/**
 * Validate request parts with zod schemas. Parsed (coerced, defaulted) values
 * are stored on `req.valid.{body,query,params}` because Express 5's `req.query`
 * is a read-only getter.
 *
 * A ZodError is thrown on failure and mapped to 400 VALIDATION_ERROR by errorHandler.
 *
 * @example
 * router.get('/', validate({ query: listQuery }), controller.list)
 * // controller: const { search, page } = req.valid.query;
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 * @returns {import('express').RequestHandler}
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid ??= {};
    if (schemas.params) req.valid.params = schemas.params.parse(req.params);
    if (schemas.query) req.valid.query = schemas.query.parse(req.query);
    if (schemas.body) req.valid.body = schemas.body.parse(req.body ?? {});
    next();
  };
}
