import axiosClient from './axiosClient';

export const postApi = {
  getPosts: (params) => axiosClient.get('/posts', { params }),
  getPostBySlug: (slug) => axiosClient.get(`/posts/${slug}`),
  getPostCategories: () => axiosClient.get('/post-categories'),
};
