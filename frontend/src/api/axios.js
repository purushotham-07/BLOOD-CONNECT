import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Keep this nice and fast: no request transform overhead.
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bloodconnect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gracefully handle auth failures and normalize error payloads.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bloodconnect_token');
      localStorage.removeItem('bloodconnect_user');
      // Avoid redirect loops on the login page itself.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;