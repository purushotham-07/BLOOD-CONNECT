const asyncHandler = require('../../utils/asyncHandler');
const userService = require('./user.service');

exports.getProfile = asyncHandler(async (req, res) => {
  const data = await userService.getProfile(req.user.id);
  res.json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

exports.getLocation = asyncHandler(async (req, res) => {
  const data = await userService.getLocation(req.user.id);
  res.json({ success: true, data });
});

exports.setLocation = asyncHandler(async (req, res) => {
  const data = await userService.setLocation(req.user.id, req.body);
  res.json({ success: true, data });
});