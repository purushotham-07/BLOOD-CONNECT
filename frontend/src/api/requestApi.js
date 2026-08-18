import api from './axios';

export const requestApi = {
  create: (payload) => api.post('/blood-requests', payload),
  list: (params) => api.get('/blood-requests', { params }),
  get: (id) => api.get(`/blood-requests/${id}`),
  cancel: (id) => api.patch(`/blood-requests/${id}/cancel`),
  matches: (id) => api.get(`/blood-requests/${id}/matches`),
  responses: (id) => api.get(`/blood-requests/${id}/responses`),
  respond: (id, status) => api.post(`/blood-requests/${id}/respond`, { status }),
  confirmDonation: (id, payload = {}) => api.post(`/blood-requests/${id}/confirm-donation`, payload),
};

export default requestApi;