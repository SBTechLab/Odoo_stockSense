import { apiClient } from './client.js';

export async function listContactsApi(params = {}) {
  return apiClient.get('/contacts', { params });
}

export async function getContactApi(id) {
  return apiClient.get(`/contacts/${id}`);
}

export async function createContactApi(data) {
  return apiClient.post('/contacts', data);
}

export async function updateContactApi(id, data) {
  return apiClient.patch(`/contacts/${id}`, data);
}

export async function deleteContactApi(id) {
  return apiClient.delete(`/contacts/${id}`);
}
