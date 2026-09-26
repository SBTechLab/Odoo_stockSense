import * as activityService from './activity.service.js';

export async function list(req, res) {
  const { rows, meta } = await activityService.list(req.valid?.query || req.query);
  res.json({ success: true, data: rows, meta });
}
