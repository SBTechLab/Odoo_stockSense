import { apiClient } from './client.js';

export const listContactsApi = (params = {}) => apiClient.get('/contacts', { params });
export const getContactApi = (id) => apiClient.get(`/contacts/${id}`);
export const createContactApi = (data) => apiClient.post('/contacts', data);
export const updateContactApi = (id, data) => apiClient.patch(`/contacts/${id}`, data);
export const deleteContactApi = (id) => apiClient.delete(`/contacts/${id}`);
