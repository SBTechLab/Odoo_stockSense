import { apiClient } from './client.js';

export const listMovesApi = (params = {}) => apiClient.get('/moves', { params });
export const getMovesBoardApi = (params = {}) => apiClient.get('/moves/board', { params });
export const exportMovesApi = () => '/api/moves/export';
