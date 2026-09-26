import { apiClient } from './client.js';

export const listOperationsApi = (params = {}) => apiClient.get('/operations', { params });
export const getBoardApi = (params = {}) => apiClient.get('/operations/board', { params });
export const getOperationApi = (id) => apiClient.get(`/operations/${id}`);
export const createOperationApi = (data) => apiClient.post('/operations', data);
export const updateOperationApi = (id, data) => apiClient.patch(`/operations/${id}`, data);
export const deleteOperationApi = (id) => apiClient.delete(`/operations/${id}`);
export const confirmOperationApi = (id) => apiClient.post(`/operations/${id}/confirm`);
export const checkAvailabilityApi = (id) => apiClient.post(`/operations/${id}/check-availability`);
export const validateOperationApi = (id) => apiClient.post(`/operations/${id}/validate`);
export const cancelOperationApi = (id) => apiClient.post(`/operations/${id}/cancel`);
