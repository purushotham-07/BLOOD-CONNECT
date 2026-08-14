import api from './axios';

export const chatApi = {
  getMessages: (requestId) => api.get(`/chat/${requestId}`),
  sendMessage: (requestId, message) => api.post(`/chat/${requestId}`, { message }),
};

export default chatApi;
