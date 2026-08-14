import api from './axios';

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  unreadCount: () => api.get('/notifications/unread-count'),
};

export default notificationApi;