const { Router } = require('express');

const router = Router();

// Public health endpoint.
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', service: 'bloodconnect-api', time: new Date().toISOString() },
  });
});

// Module routers (all mounted under /api).
router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/users', require('./modules/users/user.routes'));
router.use('/donors', require('./modules/donors/donor.routes'));
router.use('/blood-requests', require('./modules/bloodRequests/bloodRequest.routes'));
router.use('/blood-requests', require('./modules/matching/matching.routes'));
router.use('/donations', require('./modules/donations/donation.routes'));
router.use('/notifications', require('./modules/notifications/notification.routes'));
router.use('/chat', require('./modules/chat/chat.routes'));
router.use('/camps', require('./modules/camps/camp.routes'));

module.exports = router;