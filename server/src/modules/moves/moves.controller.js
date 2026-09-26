import { ok } from '../../lib/serialize.js';
import * as service from './moves.service.js';

export async function list(req, res) {
  const result = await service.list(req.valid.query);
  ok(res, result.data, { meta: result.meta });
}

export async function getBoard(req, res) {
  const board = await service.getBoard(req.valid.query);
  ok(res, board);
}

export async function exportCSV(req, res) {
  const csv = await service.exportCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="moves_ledger.csv"');
  res.status(200).send(csv);
}
