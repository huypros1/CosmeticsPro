import axiosClient from './axiosClient';

export const productApi = {
  // Products
  getProducts: (params) => axiosClient.get('/products', { params }),
  getProductBySlug: (slug) => axiosClient.get(`/products/${slug}`),
  getFeaturedProducts: () => axiosClient.get('/products/featured'),
  searchProducts: (q) => axiosClient.get('/products/search', { params: { q } }),

  // Categories
  getCategories: () => axiosClient.get('/categories'),
  getCategoryBySlug: (slug) => axiosClient.get(`/categories/${slug}`),

  // Brands
  getBrands: () => axiosClient.get('/brands'),
};
