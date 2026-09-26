import { ok } from '../../lib/serialize.js';
import * as service from './dashboard.service.js';

export async function summary(req, res) {
  const result = await service.getSummary(req.valid.query);
  ok(res, result);
}

export async function operationCards(req, res) {
  const result = await service.getOperationCards(req.valid.query);
  ok(res, result);
}

export async function trends(req, res) {
  const result = await service.getTrends(req.valid.query);
  ok(res, result);
}

export async function topProducts(req, res) {
  const result = await service.getTopProducts(req.valid.query);
  ok(res, result);
}
