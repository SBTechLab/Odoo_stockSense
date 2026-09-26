import { apiClient } from './client.js';

export const listStockApi = (params = {}) => apiClient.get('/stock', { params });
export const exportStockApi = () => '/api/stock/export';
