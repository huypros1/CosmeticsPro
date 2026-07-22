import axiosClient from './axiosClient';

export const voucherApi = {
  validateVoucher: (code, order_value = 0) =>
    axiosClient.post('/vouchers/validate', { code, order_value }),

  // Admin Endpoints
  getAll: () => axiosClient.get('/admin/vouchers'),
  getById: (id) => axiosClient.get(`/admin/vouchers/${id}`),
  create: (data) => axiosClient.post('/admin/vouchers', data),
  update: (id, data) => axiosClient.put(`/admin/vouchers/${id}`, data),
  delete: (id) => axiosClient.delete(`/admin/vouchers/${id}`),
  toggleStatus: (id) => axiosClient.patch(`/admin/vouchers/${id}/toggle-status`),
};
