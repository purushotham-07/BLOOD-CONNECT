import api from './axios';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.put('/users/profile', payload),
  getLocation: () => api.get('/users/location'),
  setLocation: (payload) => api.put('/users/location', payload),
};

export default authApi;