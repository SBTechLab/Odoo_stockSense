import { ok } from '../../lib/serialize.js';
import * as service from './adjustments.service.js';

export async function list(req, res) {
  const result = await service.list(req.valid.query);
  ok(res, result.data, { meta: result.meta });
}

export async function get(req, res) {
  ok(res, await service.getById(req.valid.params.id));
}

export async function getOnHand(req, res) {
  const { locationId, productId } = req.valid.query;
  ok(res, await service.getOnHand(locationId, productId));
}

export async function create(req, res) {
  ok(res, await service.create(req.user.id, req.valid.body), { status: 201 });
}
