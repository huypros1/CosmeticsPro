import axiosClient from './axiosClient';

export const profileApi = {
  // Profile
  getProfile: () => axiosClient.get('/profile'),
  updateProfile: (data) => axiosClient.put('/profile', data),
  // data: { name, avatar? }
  changePassword: (data) => axiosClient.put('/profile/password', data),
  // data: { current_password, password, password_confirmation }

  // Addresses
  getAddresses: () => axiosClient.get('/profile/addresses'),
  addAddress: (data) => axiosClient.post('/profile/addresses', data),
  // data: { address_line, phone, status? }
  updateAddress: (id, data) => axiosClient.put(`/profile/addresses/${id}`, data),
  deleteAddress: (id) => axiosClient.delete(`/profile/addresses/${id}`),
  setDefaultAddress: (id) => axiosClient.put(`/profile/addresses/${id}/default`),
};
