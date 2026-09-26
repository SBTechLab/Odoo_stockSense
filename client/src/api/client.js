import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    // Envelope unwrap: return { data, meta }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const errData = error.response.data?.error || {};
      const status = error.response.status;

      const normalized = {
        status,
        code: errData.code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'API_ERROR'),
        message: errData.message || (status === 401 ? 'Session expired, please log in' : 'Request failed'),
        details: errData.details || [],
      };

      // Redirect on 401 Unauthorized if not already on an auth page
      if (status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && !window.location.pathname.startsWith('/forgot-password') && !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }

      return Promise.reject(normalized);
    }

    return Promise.reject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: error.message || 'Network connection failed',
      details: [],
    });
  }
);
