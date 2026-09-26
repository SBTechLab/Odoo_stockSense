import { apiClient } from './client.js';

export async function listUsersApi(params = {}) {
  return apiClient.get('/users', { params });
}

export async function updateUserApi(id, data) {
  return apiClient.patch(`/users/${id}`, data);
}
