import { ok } from '../../lib/serialize.js';
import * as service from './users.service.js';

export async function list(req, res) {
  const { items, meta } = await service.list(req.valid.query);
  ok(res, items, { meta });
}

export async function update(req, res) {
  ok(res, await service.update(req.user, req.valid.params.id, req.valid.body));
}
