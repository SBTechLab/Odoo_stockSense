import { apiClient } from './client.js';

export const listAdjustmentsApi = (params = {}) => apiClient.get('/adjustments', { params });
export const getAdjustmentApi = (id) => apiClient.get(`/adjustments/${id}`);
export const createAdjustmentApi = (data) => apiClient.post('/adjustments', data);
export const getAdjustmentOnHandApi = (locationId, productId) =>
  apiClient.get('/adjustments/on-hand', { params: { locationId, productId } });
