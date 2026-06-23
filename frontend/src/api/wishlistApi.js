import axiosClient from './axiosClient';

export const wishlistApi = {
  getWishlist: () => axiosClient.get('/wishlist'),
  addToWishlist: (productId) => axiosClient.post('/wishlist', { product_id: productId }),
  removeFromWishlist: (productId) => axiosClient.delete(`/wishlist/${productId}`),
};
