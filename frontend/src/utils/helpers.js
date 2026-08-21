export const getImgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://backend.test/api').replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};
