import axiosClient from './axiosClient';

// Helper: attach auth header
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const adminApi = {
  // Dashboard
  getDashboard: (params) => axiosClient.get('/admin/dashboard', { params }),

  // Categories
  getCategories: (params) => axiosClient.get('/admin/categories', { params }),
  createCategory: (data) => axiosClient.post('/admin/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, data) => axiosClient.post(`/admin/categories/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`),

  // Brands
  getBrands: (params) => axiosClient.get('/admin/brands', { params }),
  createBrand: (data) => axiosClient.post('/admin/brands', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBrand: (id, data) => axiosClient.post(`/admin/brands/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`),

  // Products
  getProducts: (params) => axiosClient.get('/admin/products', { params }),
  createProduct: (data) => axiosClient.post('/admin/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id, data) => axiosClient.post(`/admin/products/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id) => axiosClient.delete(`/admin/products/${id}`),
  toggleProductStatus: (id) => axiosClient.patch(`/admin/products/${id}/toggle-status`),

  // Orders
  getOrders: (params) => axiosClient.get('/admin/orders', { params }),
  getOrder: (id) => axiosClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => axiosClient.put(`/admin/orders/${id}/status`, data),
  confirmPayment: (id) => axiosClient.post(`/admin/payment/${id}/confirm`, {}),

  // Users
  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  updateUserRole: (id, role) => axiosClient.put(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }),

  // Posts
  getPosts: (params) => axiosClient.get('/admin/posts', { params }),
  getPostCategories: () => axiosClient.get('/admin/posts/categories'),
  createPost: (data) => axiosClient.post('/admin/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id, data) => axiosClient.post(`/admin/posts/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id) => axiosClient.delete(`/admin/posts/${id}`),

  // Reviews
  getReviews: (params) => axiosClient.get('/admin/reviews', { params }),
  deleteReview: (id) => axiosClient.delete(`/admin/reviews/${id}`),

  // Flash Sales
  getFlashSales: (params) => axiosClient.get('/admin/flash-sales', { params }),
  getFlashSale: (id) => axiosClient.get(`/admin/flash-sales/${id}`),
  createFlashSale: (data) => axiosClient.post('/admin/flash-sales', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateFlashSale: (id, data) => axiosClient.post(`/admin/flash-sales/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFlashSale: (id) => axiosClient.delete(`/admin/flash-sales/${id}`),
  toggleFlashSaleStatus: (id) => axiosClient.patch(`/admin/flash-sales/${id}/toggle-status`),
};
