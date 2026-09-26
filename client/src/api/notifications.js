import { apiClient } from './client.js';

export const listNotificationsApi = (params = {}) => apiClient.get('/notifications', { params });
export const markNotificationReadApi = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => apiClient.post('/notifications/read-all');
