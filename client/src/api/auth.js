import { apiClient } from './client.js';

export async function loginApi(credentials) {
  return apiClient.post('/auth/login', credentials);
}

export async function registerApi(userData) {
  return apiClient.post('/auth/register', userData);
}

export async function logoutApi() {
  return apiClient.post('/auth/logout');
}

export async function getMeApi() {
  return apiClient.get('/auth/me');
}

export async function updateProfileApi(data) {
  return apiClient.patch('/auth/me', data);
}

export async function updatePasswordApi(data) {
  return apiClient.patch('/auth/me/password', data);
}

export async function forgotPasswordApi(email) {
  return apiClient.post('/auth/forgot-password', { email });
}

export async function verifyOtpApi(email, otp) {
  return apiClient.post('/auth/verify-otp', { email, otp });
}

/** Server expects { resetToken, password, confirmPassword } (see auth.schema.js resetPasswordBody). */
export async function resetPasswordApi(resetToken, password, confirmPassword = password) {
  return apiClient.post('/auth/reset-password', { resetToken, password, confirmPassword });
}
