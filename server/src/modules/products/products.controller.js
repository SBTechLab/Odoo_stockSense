import { ok } from '../../lib/serialize.js';
import * as service from './products.service.js';

export async function list(req, res) {
  const result = await service.list(req.valid.query);
  ok(res, result.data, { meta: result.meta });
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
  await service.remove(req.user.id, req.valid.params.id);
  ok(res, { id: req.valid.params.id });
}

export async function getStock(req, res) {
  ok(res, await service.getProductStock(req.valid.params.id));
}

export async function getMoves(req, res) {
  const result = await service.getProductMoves(req.valid.params.id, req.query);
  ok(res, result.data, { meta: result.meta });
}

export async function exportCSV(req, res) {
  const csv = await service.exportCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
  res.status(200).send(csv);
}

export async function bulkImport(req, res) {
  const result = await service.bulkImport(req.user.id, req.body);
  ok(res, result);
}
