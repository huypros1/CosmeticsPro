import axiosClient from './axiosClient';

// Helper: attach auth header
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const adminApi = {
  // Dashboard
  getDashboard: () => axiosClient.get('/admin/dashboard', auth()),

  // Categories
  getCategories: (params) => axiosClient.get('/admin/categories', { ...auth(), params }),
  createCategory: (data) => axiosClient.post('/admin/categories', data, auth()),
  updateCategory: (id, data) => axiosClient.post(`/admin/categories/${id}?_method=PUT`, data, auth()),
  deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`, auth()),

  // Brands
  getBrands: (params) => axiosClient.get('/admin/brands', { ...auth(), params }),
  createBrand: (data) => axiosClient.post('/admin/brands', data, auth()),
  updateBrand: (id, data) => axiosClient.post(`/admin/brands/${id}?_method=PUT`, data, auth()),
  deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`, auth()),

  // Products
  getProducts: (params) => axiosClient.get('/admin/products', { ...auth(), params }),
  createProduct: (data) => axiosClient.post('/admin/products', data, auth()),
  updateProduct: (id, data) => axiosClient.post(`/admin/products/${id}?_method=PUT`, data, auth()),
  deleteProduct: (id) => axiosClient.delete(`/admin/products/${id}`, auth()),
  toggleProductStatus: (id) => axiosClient.patch(`/admin/products/${id}/toggle-status`, {}, auth()),

  // Orders
  getOrders: (params) => axiosClient.get('/admin/orders', { ...auth(), params }),
  getOrder: (id) => axiosClient.get(`/admin/orders/${id}`, auth()),
  updateOrderStatus: (id, data) => axiosClient.put(`/admin/orders/${id}/status`, data, auth()),
  confirmPayment: (id) => axiosClient.post(`/admin/payment/${id}/confirm`, {}, auth()),

  // Users
  getUsers: (params) => axiosClient.get('/admin/users', { ...auth(), params }),
  updateUserRole: (id, role) => axiosClient.put(`/admin/users/${id}/role`, { role }, auth()),
  updateUserStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }, auth()),

  // Posts
  getPosts: (params) => axiosClient.get('/admin/posts', { ...auth(), params }),
  getPostCategories: () => axiosClient.get('/admin/posts/categories', auth()),
  createPost: (data) => axiosClient.post('/admin/posts', data, auth()),
  updatePost: (id, data) => axiosClient.post(`/admin/posts/${id}?_method=PUT`, data, auth()),
  deletePost: (id) => axiosClient.delete(`/admin/posts/${id}`, auth()),

  // Reviews
  getReviews: (params) => axiosClient.get('/admin/reviews', { ...auth(), params }),
  deleteReview: (id) => axiosClient.delete(`/admin/reviews/${id}`, auth()),

  // Flash Sales
  getFlashSales: (params) => axiosClient.get('/admin/flash-sales', { ...auth(), params }),
  getFlashSale: (id) => axiosClient.get(`/admin/flash-sales/${id}`, auth()),
  createFlashSale: (data) => axiosClient.post('/admin/flash-sales', data, auth()),
  updateFlashSale: (id, data) => axiosClient.put(`/admin/flash-sales/${id}`, data, auth()),
  deleteFlashSale: (id) => axiosClient.delete(`/admin/flash-sales/${id}`, auth()),
  toggleFlashSaleStatus: (id) => axiosClient.patch(`/admin/flash-sales/${id}/toggle-status`, {}, auth()),
};
