import axiosClient from './axiosClient';

export const orderApi = {
  getOrders: (params) => axiosClient.get('/orders', { params }),
  getOrderById: (id) => axiosClient.get(`/orders/${id}`),
  placeOrder: (data) => axiosClient.post('/orders', data),
  // data: { shipping_address_id, voucher_id?, payment_method, items:[{variant_id, quantity}] }
  cancelOrder: (id) => axiosClient.post(`/orders/${id}/cancel`),
};
