import { ok } from '../../lib/serialize.js';
import * as service from './stock.service.js';

export async function list(req, res) {
  const result = await service.list(req.valid.query);
  ok(res, result.data, { meta: result.meta, totals: result.totals });
}

export async function exportCSV(req, res) {
  const csv = await service.exportCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="stock_report.csv"');
  res.status(200).send(csv);
}
