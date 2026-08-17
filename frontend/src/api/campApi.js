import api from './axios';

export const campApi = {
  list: (params) => api.get('/camps', { params }),
  get: (id) => api.get(`/camps/${id}`),
  create: (payload) => api.post('/camps', payload),
  pledge: (id) => api.post(`/camps/${id}/pledge`),
  cancelPledge: (id) => api.delete(`/camps/${id}/pledge`),
};

export default campApi;
