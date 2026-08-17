const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const campController = require('./camp.controller');

const router = Router();

// Publicly browse camps or filter by location
router.get('/', campController.listCamps);
router.get('/:id', protect, campController.getCamp);

// Authenticated camp actions
router.post('/', protect, campController.createCamp);
router.post('/:id/pledge', protect, campController.pledgeAttendance);
router.delete('/:id/pledge', protect, campController.cancelPledge);

module.exports = router;
