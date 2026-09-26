import { ok } from '../../lib/serialize.js';
import * as service from './replenishment.service.js';

export async function list(req, res) {
  const suggestions = await service.getSuggestions();
  ok(res, suggestions);
}
