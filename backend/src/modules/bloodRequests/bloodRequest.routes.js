const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const bloodRequestController = require('./bloodRequest.controller');
const { createRequestValidation } = require('./bloodRequest.validation');

const router = Router();

router.use(protect);

// Create request - any authenticated user (typically a requester).
router.post('/', createRequestValidation, validate, bloodRequestController.createRequest);

router.get('/', bloodRequestController.listRequests);
router.get('/:id', bloodRequestController.getRequest);
router.patch('/:id/cancel', bloodRequestController.cancelRequest);

module.exports = router;