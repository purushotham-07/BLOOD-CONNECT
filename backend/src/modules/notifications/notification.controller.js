const asyncHandler = require('../../utils/asyncHandler');
const notificationService = require('./notification.service');

exports.listForUser = asyncHandler(async (req, res) => {
  const data = await notificationService.listForUser(req.user.id);
  res.json({ success: true, data });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.unreadCountForUser(req.user.id);
  res.json({ success: true, data: { count } });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json({ success: true, data });
});