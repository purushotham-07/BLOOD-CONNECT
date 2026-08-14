const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const userController = require('./user.controller');
const { updateProfileValidation, locationValidation } = require('./user.validation');

const router = Router();

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, validate, userController.updateProfile);

// User location persistence (requester or any user's default location).
router.get('/location', userController.getLocation);
router.put('/location', locationValidation, validate, userController.setLocation);

module.exports = router;