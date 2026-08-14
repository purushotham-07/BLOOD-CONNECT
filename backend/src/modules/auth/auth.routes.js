const { Router } = require('express');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const authController = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');

const router = Router();

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/me', protect, authController.me);

module.exports = router;