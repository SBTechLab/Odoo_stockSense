import { ok } from '../../lib/serialize.js';
import * as service from './voice.service.js';

export async function parse(req, res) {
  ok(res, await service.parseCommand(req.valid.body));
}
