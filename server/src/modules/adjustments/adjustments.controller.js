import { ok } from '../../lib/serialize.js';
import * as service from './adjustments.service.js';

export async function list(req, res) {
  const { items, meta } = await service.list(req.valid.query);
  ok(res, items, { meta });
}

export async function get(req, res) {
  ok(res, await service.getById(req.valid.params.id));
}

export async function create(req, res) {
  ok(res, await service.create(req.user.id, req.valid.body), { status: 201 });
}
