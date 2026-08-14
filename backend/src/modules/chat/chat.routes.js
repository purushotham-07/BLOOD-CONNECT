const { Router } = require('express');
const { body } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../utils/validate');
const chatController = require('./chat.controller');

const router = Router();

router.use(protect);

router.get('/:requestId', chatController.getMessages);
router.post(
  '/:requestId',
  body('message').trim().notEmpty().withMessage('Message is required'),
  validate,
  chatController.sendMessage
);

module.exports = router;
