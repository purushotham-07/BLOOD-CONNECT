const asyncHandler = require('../../utils/asyncHandler');
const donorService = require('./donor.service');
const matchingService = require('../matching/matching.service');

exports.createProfile = asyncHandler(async (req, res) => {
  const data = await donorService.getOrCreateProfile(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const data = await donorService.getProfile(req.user.id);
  res.json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const data = await donorService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

exports.updateAvailability = asyncHandler(async (req, res) => {
  const data = await donorService.updateAvailability(req.user.id, req.body.available);
  res.json({ success: true, data });
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const data = await donorService.updateLocation(req.user.id, req.body);
  res.json({ success: true, data });
});

exports.getEligibility = asyncHandler(async (req, res) => {
  const data = await donorService.getEligibility(req.user.id);
  res.json({ success: true, data });
});

exports.getMatchedRequests = asyncHandler(async (req, res) => {
  const data = await matchingService.getMatchedRequestsForDonor(req.user);
  res.json({ success: true, data });
});

exports.getDensity = asyncHandler(async (req, res) => {
  const data = await donorService.getDonorDensity(req.query.bloodGroup);
  res.json({ success: true, data });
});