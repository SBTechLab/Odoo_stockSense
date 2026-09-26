import { ok } from '../../lib/serialize.js';
import * as service from './search.service.js';

export async function search(req, res) {
  const result = await service.globalSearch(req.query.q);
  ok(res, result);
}
