const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const matchingController = require('./matching.controller');

const router = Router();

// Matches and responses for a request
router.get('/:id/matches', protect, matchingController.getMatches);
router.get('/:id/responses', protect, matchingController.getResponses);
router.post('/:id/respond', protect, matchingController.respond);
router.post('/:id/confirm-donation', protect, matchingController.confirmDonation);

module.exports = router;