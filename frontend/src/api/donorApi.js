import api from './axios';

export const donorApi = {
  getProfile: () => api.get('/donors/profile'),
  createProfile: (payload) => api.post('/donors/profile', payload),
  updateProfile: (payload) => api.put('/donors/profile', payload),
  updateAvailability: (available) => api.patch('/donors/availability', { available }),
  updateLocation: (payload) => api.put('/donors/location', payload),
  getEligibility: () => api.get('/donors/eligibility'),
  getMatchedRequests: () => api.get('/donors/matched-requests'),
  getDensity: (params) => api.get('/donors/density', { params }),
  recordDonation: (payload) => api.post('/donations', payload),
  myDonations: () => api.get('/donations'),
};

export default donorApi;