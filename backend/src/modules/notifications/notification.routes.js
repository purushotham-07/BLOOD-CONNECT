const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const notificationController = require('./notification.controller');

const router = Router();

router.use(protect);

router.get('/', notificationController.listForUser);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;