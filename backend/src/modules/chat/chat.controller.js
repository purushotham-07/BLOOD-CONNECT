const asyncHandler = require('../../utils/asyncHandler');
const chatService = require('./chat.service');

exports.getMessages = asyncHandler(async (req, res) => {
  const data = await chatService.getMessages(req.params.requestId, req.user);
  res.json({ success: true, data });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const data = await chatService.sendMessage(req.params.requestId, req.user, req.body.message);
  res.status(201).json({ success: true, data });
});
