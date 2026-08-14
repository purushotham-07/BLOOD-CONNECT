const notificationRepository = require('./notification.repository');
const AppError = require('../../utils/AppError');

async function listForUser(userId) {
  return notificationRepository.listForUser(userId);
}

async function unreadCountForUser(userId) {
  return notificationRepository.unreadCountForUser(userId);
}

async function markAsRead(id, userId) {
  const updated = await notificationRepository.markAsRead(id, userId);
  if (!updated) throw new AppError('Notification not found', 404);
  return updated;
}

module.exports = { listForUser, unreadCountForUser, markAsRead };