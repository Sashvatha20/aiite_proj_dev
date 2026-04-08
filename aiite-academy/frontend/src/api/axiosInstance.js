import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aiite_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('aiite_token');
      localStorage.removeItem('aiite_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;