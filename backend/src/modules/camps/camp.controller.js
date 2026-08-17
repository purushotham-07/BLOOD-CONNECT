const asyncHandler = require('../../utils/asyncHandler');
const campService = require('./camp.service');

exports.listCamps = asyncHandler(async (req, res) => {
  const data = await campService.listCamps(req.query);
  res.json({ success: true, data });
});

exports.getCamp = asyncHandler(async (req, res) => {
  const data = await campService.getCamp(req.params.id, req.user);
  res.json({ success: true, data });
});

exports.createCamp = asyncHandler(async (req, res) => {
  const data = await campService.createCamp(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.pledgeAttendance = asyncHandler(async (req, res) => {
  const data = await campService.pledgeAttendance(req.params.id, req.user);
  res.status(201).json({ success: true, data });
});

exports.cancelPledge = asyncHandler(async (req, res) => {
  const data = await campService.cancelPledge(req.params.id, req.user);
  res.json({ success: true, data });
});
