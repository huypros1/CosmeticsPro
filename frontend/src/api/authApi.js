import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
};
