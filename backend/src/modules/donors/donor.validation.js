const { body } = require('express-validator');
const { BLOOD_GROUPS } = require('../../constants/enums');

exports.createDonorValidation = [
  body('bloodGroup')
    .trim()
    .notEmpty()
    .withMessage('Blood group is required')
    .isIn(BLOOD_GROUPS)
    .withMessage('Invalid blood group'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('available').optional().isBoolean().withMessage('Available must be a boolean'),
  body('lastDonationDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Last donation date must be a valid date'),
  body('notificationRadius')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Notification radius must be between 1 and 500 km'),
];

exports.updateDonorValidation = [
  body('bloodGroup')
    .optional()
    .trim()
    .isIn(BLOOD_GROUPS)
    .withMessage('Invalid blood group'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('available').optional().isBoolean().withMessage('Available must be a boolean'),
  body('lastDonationDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Last donation date must be a valid date'),
  body('notificationRadius')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Notification radius must be between 1 and 500 km'),
];

exports.availabilityValidation = [
  body('available').isBoolean().withMessage('Available must be a boolean'),
];

exports.locationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a number between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a number between -180 and 180'),
];