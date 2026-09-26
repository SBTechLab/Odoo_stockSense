import { apiClient } from './client.js';

export async function listOperationsApi(params = {}) {
  return apiClient.get('/operations', { params });
}

export async function getOperationsBoardApi(params = {}) {
  return apiClient.get('/operations/board', { params });
}

export async function getOperationApi(id) {
  return apiClient.get(`/operations/${id}`);
}

export async function createOperationApi(data) {
  return apiClient.post('/operations', data);
}

export async function updateOperationApi(id, data) {
  return apiClient.patch(`/operations/${id}`, data);
}

export async function deleteOperationApi(id) {
  return apiClient.delete(`/operations/${id}`);
}

export async function confirmOperationApi(id) {
  return apiClient.post(`/operations/${id}/confirm`);
}

export async function checkOperationAvailabilityApi(id) {
  return apiClient.post(`/operations/${id}/check-availability`);
}

export async function validateOperationApi(id) {
  return apiClient.post(`/operations/${id}/validate`);
}

export async function cancelOperationApi(id) {
  return apiClient.post(`/operations/${id}/cancel`);
}
