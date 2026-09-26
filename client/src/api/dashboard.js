import { apiClient } from './client.js';

export const getDashboardSummaryApi = (params = {}) => apiClient.get('/dashboard/summary', { params });
export const getDashboardOperationCardsApi = (params = {}) => apiClient.get('/dashboard/operation-cards', { params });
export const getDashboardTrendsApi = (params = {}) => apiClient.get('/dashboard/trends', { params });
export const getDashboardTopProductsApi = (params = {}) => apiClient.get('/dashboard/top-products', { params });
