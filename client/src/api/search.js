import { apiClient } from './client.js';

export const globalSearchApi = (q) => apiClient.get('/search', { params: { q } });
