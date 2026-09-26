import { ok } from '../../lib/serialize.js';
import * as service from './notifications.service.js';

export async function list(req, res) {
  const result = await service.list(req.user.id, req.valid.query);
  ok(res, result.data, { meta: result.meta, unreadCount: result.unreadCount });
}

export async function markAsRead(req, res) {
  const result = await service.markAsRead(req.user.id, req.valid.params.id);
  ok(res, result);
}

export async function markAllAsRead(req, res) {
  const result = await service.markAllAsRead(req.user.id);
  ok(res, result);
}
