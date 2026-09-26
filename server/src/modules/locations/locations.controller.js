import * as locationService from './locations.service.js';

export async function list(req, res) {
  const data = await locationService.list(req.valid?.query);
  res.json({ success: true, data });
}

export async function getById(req, res) {
  const data = await locationService.getById(req.valid?.params?.id || req.params.id);
  res.json({ success: true, data });
}

export async function create(req, res) {
  const data = await locationService.create(req.user.id, req.valid.body);
  res.status(201).json({ success: true, data });
}

export async function update(req, res) {
  const data = await locationService.update(
    req.user.id,
    req.valid?.params?.id || req.params.id,
    req.valid.body
  );
  res.json({ success: true, data });
}

export async function remove(req, res) {
  const data = await locationService.remove(
    req.user.id,
    req.valid?.params?.id || req.params.id
  );
  res.json({ success: true, data });
}
