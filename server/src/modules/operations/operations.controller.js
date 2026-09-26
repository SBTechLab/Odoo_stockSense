import { ok } from '../../lib/serialize.js';
import * as service from './operations.service.js';

export async function list(req, res) {
  const { items, meta } = await service.list(req.valid.query);
  ok(res, items, { meta });
}

export async function getBoard(req, res) {
  ok(res, await service.getBoard(req.valid.query));
}

export async function get(req, res) {
  ok(res, await service.getById(req.valid.params.id));
}

export async function create(req, res) {
  ok(res, await service.create(req.user.id, req.valid.body), { status: 201 });
}

export async function update(req, res) {
  ok(res, await service.update(req.user.id, req.valid.params.id, req.valid.body));
}

export async function remove(req, res) {
  ok(res, await service.remove(req.user.id, req.valid.params.id));
}

export async function confirm(req, res) {
  ok(res, await service.confirm(req.user.id, req.valid.params.id));
}

export async function checkAvailability(req, res) {
  ok(res, await service.checkAvailability(req.user.id, req.valid.params.id));
}

export async function validate(req, res) {
  ok(res, await service.validate(req.user.id, req.valid.params.id));
}

export async function cancel(req, res) {
  ok(res, await service.cancel(req.user.id, req.valid.params.id));
}
