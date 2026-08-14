const { body } = require('express-validator');

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone must be at most 30 characters'),
  // Users pick their own role; ADMIN is intentionally never assignable here.
  body('role')
    .optional()
    .isIn(['DONOR', 'REQUESTER'])
    .withMessage('Invalid role'),
];

exports.loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];