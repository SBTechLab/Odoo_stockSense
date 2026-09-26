import { apiClient } from './client.js';

export async function listLocationsApi(params = {}) {
  return apiClient.get('/locations', { params });
}

export async function getLocationApi(id) {
  return apiClient.get(`/locations/${id}`);
}

export async function createLocationApi(data) {
  return apiClient.post('/locations', data);
}

export async function updateLocationApi(id, data) {
  return apiClient.patch(`/locations/${id}`, data);
}

export async function deleteLocationApi(id) {
  return apiClient.delete(`/locations/${id}`);
}

/** Products held in one location, with on hand / reserved / free to use. */
export async function getLocationStockApi(id) {
  return apiClient.get(`/locations/${id}/stock`);
}
