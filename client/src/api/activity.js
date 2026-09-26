import { apiClient } from './client.js';

export async function listActivityApi(params = {}) {
  return apiClient.get('/activity', { params });
}
