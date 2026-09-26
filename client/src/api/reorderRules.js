import { apiClient } from './client.js';

export const listReorderRulesApi = (params = {}) => apiClient.get('/reorder-rules', { params });
export const getReorderRuleApi = (id) => apiClient.get(`/reorder-rules/${id}`);
export const createReorderRuleApi = (data) => apiClient.post('/reorder-rules', data);
export const updateReorderRuleApi = (id, data) => apiClient.patch(`/reorder-rules/${id}`, data);
export const deleteReorderRuleApi = (id) => apiClient.delete(`/reorder-rules/${id}`);
