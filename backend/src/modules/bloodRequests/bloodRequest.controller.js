const asyncHandler = require('../../utils/asyncHandler');
const bloodRequestService = require('./bloodRequest.service');

exports.createRequest = asyncHandler(async (req, res) => {
  const data = await bloodRequestService.createRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.listRequests = asyncHandler(async (req, res) => {
  const data = await bloodRequestService.listRequests(req.user);
  res.json({ success: true, data });
});

exports.getRequest = asyncHandler(async (req, res) => {
  const data = await bloodRequestService.getRequest(req.params.id, req.user);
  res.json({ success: true, data });
});

exports.cancelRequest = asyncHandler(async (req, res) => {
  const data = await bloodRequestService.cancelRequest(req.params.id, req.user);
  res.json({ success: true, data });
});