import { apiClient } from './client.js';

export async function listProductsApi(params = {}) {
  return apiClient.get('/products', { params });
}

export async function getProductApi(id) {
  return apiClient.get(`/products/${id}`);
}
