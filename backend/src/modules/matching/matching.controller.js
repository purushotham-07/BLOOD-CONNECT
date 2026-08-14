const asyncHandler = require('../../utils/asyncHandler');
const matchingService = require('./matching.service');

exports.getMatches = asyncHandler(async (req, res) => {
  const data = await matchingService.getMatches(req.params.id, req.user);
  res.json({ success: true, data });
});

exports.getResponses = asyncHandler(async (req, res) => {
  const data = await matchingService.getResponses(req.params.id, req.user);
  res.json({ success: true, data });
});

exports.respond = asyncHandler(async (req, res) => {
  const data = await matchingService.respond(req.params.id, req.user, req.body);
  res.status(201).json({ success: true, data });
});