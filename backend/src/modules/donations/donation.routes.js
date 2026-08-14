const { Router } = require('express');
const { body } = require('express-validator');
const { protect, requireRole } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const donationController = require('./donation.controller');
const { COMPONENTS } = require('../../constants/enums');

const router = Router();

router.use(protect, requireRole('DONOR'));

router.post(
  '/',
  body('donationDate')
    .isISO8601()
    .withMessage('donationDate must be a valid date')
    .toDate()
    .custom((value) => value <= new Date())
    .withMessage('donationDate cannot be in the future'),
  body('component')
    .trim()
    .notEmpty()
    .withMessage('Component is required')
    .isIn(COMPONENTS)
    .withMessage('Invalid component'),
  validate,
  donationController.recordDonation
);

router.get('/', donationController.listMyDonations);

module.exports = router;