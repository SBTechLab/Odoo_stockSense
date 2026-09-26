import * as locationService from './locations.service.js';
import { serialize } from '../../lib/serialize.js';

export async function list(req, res) {
  const data = await locationService.list(req.valid?.query);
  res.json({ success: true, data: serialize(data) });
}

export async function getById(req, res) {
  const data = await locationService.getById(req.valid?.params?.id || req.params.id);
  res.json({ success: true, data: serialize(data) });
}

export async function getStock(req, res) {
  const data = await locationService.getStock(req.valid?.params?.id || req.params.id);
  res.json({ success: true, data: serialize(data) });
}

export async function create(req, res) {
  const data = await locationService.create(req.user.id, req.valid.body);
  res.status(201).json({ success: true, data: serialize(data) });
}

export async function update(req, res) {
  const data = await locationService.update(
    req.user.id,
    req.valid?.params?.id || req.params.id,
    req.valid.body
  );
  res.json({ success: true, data: serialize(data) });
}

export async function remove(req, res) {
  const data = await locationService.remove(
    req.user.id,
    req.valid?.params?.id || req.params.id
  );
  res.json({ success: true, data });
}
