import { apiClient } from './client.js';

export async function listAdjustmentsApi(params = {}) {
  return apiClient.get('/adjustments', { params });
}

export async function getAdjustmentApi(id) {
  return apiClient.get(`/adjustments/${id}`);
}

export async function getAdjustmentOnHandApi(locationId, productId) {
  return apiClient.get('/adjustments/on-hand', { params: { locationId, productId } });
}

export async function createAdjustmentApi(data) {
  return apiClient.post('/adjustments', data);
}
