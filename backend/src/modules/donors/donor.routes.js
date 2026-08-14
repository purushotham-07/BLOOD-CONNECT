const { Router } = require('express');
const { protect, requireRole } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const donorController = require('./donor.controller');
const {
  createDonorValidation,
  updateDonorValidation,
  availabilityValidation,
  locationValidation,
} = require('./donor.validation');

const router = Router();

router.use(protect);

// Density query accessible to all authenticated users (Donors & Receivers)
router.get('/density', donorController.getDensity);

// All other donor routes require an authenticated DONOR role
router.post('/profile', requireRole('DONOR'), createDonorValidation, validate, donorController.createProfile);
router.get('/profile', requireRole('DONOR'), donorController.getProfile);
router.put('/profile', requireRole('DONOR'), updateDonorValidation, validate, donorController.updateProfile);
router.patch('/availability', requireRole('DONOR'), availabilityValidation, validate, donorController.updateAvailability);
router.put('/location', requireRole('DONOR'), locationValidation, validate, donorController.updateLocation);
router.get('/eligibility', requireRole('DONOR'), donorController.getEligibility);
router.get('/matched-requests', requireRole('DONOR'), donorController.getMatchedRequests);

module.exports = router;