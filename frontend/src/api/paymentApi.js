import axiosClient from './axiosClient';

export const paymentApi = {
  // Tạo URL ảnh QR VietQR cho đơn hàng
  generateVietQR: (params) => axiosClient.post('/payment/vietqr', params),

  // Kiểm tra trạng thái thanh toán (dùng cho polling)
  checkStatus: (orderId) => axiosClient.get(`/payment/status/${orderId}`),

  // Admin xác nhận đã nhận thanh toán
  adminConfirmPayment: (orderId) => axiosClient.post(`/admin/payment/${orderId}/confirm`),
};

