import { apiClient } from './client.js';

export const listReplenishmentApi = () => apiClient.get('/replenishment');
