import axiosClient from './axiosClient';

export const reviewApi = {
  getProductReviews: (productId, params) =>
    axiosClient.get(`/reviews/${productId}`, { params }),
  submitReview: (data) => axiosClient.post('/reviews', data),
  // data: { product_id, rating, content }
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`),
  getReviewableProducts: (orderId) =>
    axiosClient.get(`/orders/${orderId}/reviewable`),
};
