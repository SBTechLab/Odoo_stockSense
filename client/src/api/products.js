import { apiClient } from './client.js';

export const listProductsApi = (params = {}) => apiClient.get('/products', { params });
export const getProductApi = (id) => apiClient.get(`/products/${id}`);
export const createProductApi = (data) => apiClient.post('/products', data);
export const updateProductApi = (id, data) => apiClient.patch(`/products/${id}`, data);
export const deleteProductApi = (id) => apiClient.delete(`/products/${id}`);

export const getProductStockApi = (id) => apiClient.get(`/products/${id}/stock`);
export const getProductMovesApi = (id, params = {}) => apiClient.get(`/products/${id}/moves`, { params });
export const bulkImportProductsApi = (rows) => apiClient.post('/products/bulk', rows);
export const exportProductsApi = () => '/api/products/export';
