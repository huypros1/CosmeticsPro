import axiosClient from './axiosClient';

export const cartApi = {
  getCart: () => axiosClient.get('/cart'),
  addToCart: (data) => axiosClient.post('/cart', data),
  // data: { variant_id, quantity }
  updateCartItem: (id, data) => axiosClient.put(`/cart/${id}`, data),
  // data: { quantity }
  removeCartItem: (id) => axiosClient.delete(`/cart/${id}`),
  clearCart: () => axiosClient.delete('/cart/clear'),
};
