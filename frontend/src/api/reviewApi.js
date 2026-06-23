import axiosClient from './axiosClient';

export const reviewApi = {
  getProductReviews: (productId, params) =>
    axiosClient.get(`/products/${productId}/reviews`, { params }),
  submitReview: (data) => axiosClient.post('/reviews', data),
  // data: { product_id, rating, content, image? }
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`),
};
