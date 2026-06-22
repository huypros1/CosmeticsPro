// App configuration
const config = {
  appName: 'CosmeticsPro',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  pagination: {
    defaultPageSize: 12,
  },
};

export default config;
