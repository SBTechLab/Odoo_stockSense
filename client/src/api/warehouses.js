import { apiClient } from './client.js';

export async function listWarehousesApi(params = {}) {
  return apiClient.get('/warehouses', { params });
}

export async function getWarehouseApi(id) {
  return apiClient.get(`/warehouses/${id}`);
}

export async function createWarehouseApi(data) {
  return apiClient.post('/warehouses', data);
}

export async function updateWarehouseApi(id, data) {
  return apiClient.patch(`/warehouses/${id}`, data);
}

export async function deleteWarehouseApi(id) {
  return apiClient.delete(`/warehouses/${id}`);
}
