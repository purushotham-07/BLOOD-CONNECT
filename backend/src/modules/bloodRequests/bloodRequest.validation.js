const { body } = require('express-validator');

exports.createRequestValidation = [
  body('bloodGroup')
    .trim()
    .notEmpty()
    .withMessage('Blood group is required'),
  body('component')
    .trim()
    .notEmpty()
    .withMessage('Component is required'),
  body('unitsRequired')
    .isInt({ min: 1 })
    .withMessage('Units required must be a positive integer'),
  body('hospitalName')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('urgency')
    .optional()
    .isIn(['NORMAL', 'URGENT', 'CRITICAL'])
    .withMessage('Urgency must be NORMAL, URGENT or CRITICAL'),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('expiresAt must be a valid date-time'),
];