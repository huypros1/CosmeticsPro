import axiosClient from './axiosClient';

export const productApi = {
  // Products
  getProducts: (params) => axiosClient.get('/products', { params }),
  getProductBySlug: (slug) => axiosClient.get(`/products/${slug}`),
  getFeaturedProducts: () => axiosClient.get('/products/featured'),
  getNewArrivals: () => axiosClient.get('/products/new-arrivals'),
  getOnSale: () => axiosClient.get('/products/on-sale'),
  getRelatedProducts: (slug) => axiosClient.get(`/products/${slug}/related`),
  searchProducts: (q) => axiosClient.get('/products/search', { params: { q } }),

  // Categories
  getCategories: () => axiosClient.get('/categories'),
  getCategoryBySlug: (slug) => axiosClient.get(`/categories/${slug}`),

  // Brands
  getBrands: () => axiosClient.get('/brands'),
};
