const { Router } = require('express');
const { body } = require('express-validator');
const { protect, requireRole } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const matchingController = require('./matching.controller');

const router = Router();

router.use(protect);

router.get('/:id/matches', matchingController.getMatches);
router.get('/:id/responses', matchingController.getResponses);
router.post(
  '/:id/respond',
  requireRole('DONOR'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['ACCEPTED', 'DECLINED'])
    .withMessage('Status must be ACCEPTED or DECLINED'),
  validate,
  matchingController.respond
);

module.exports = router;