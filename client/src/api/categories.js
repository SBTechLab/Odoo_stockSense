import { apiClient } from './client.js';

export const listCategoriesApi = (params = {}) => apiClient.get('/categories', { params });
export const getCategoryApi = (id) => apiClient.get(`/categories/${id}`);
export const createCategoryApi = (data) => apiClient.post('/categories', data);
export const updateCategoryApi = (id, data) => apiClient.patch(`/categories/${id}`, data);
export const deleteCategoryApi = (id) => apiClient.delete(`/categories/${id}`);
