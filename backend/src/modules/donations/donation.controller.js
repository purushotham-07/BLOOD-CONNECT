const asyncHandler = require('../../utils/asyncHandler');
const donationService = require('./donation.service');

exports.recordDonation = asyncHandler(async (req, res) => {
  const data = await donationService.recordDonation(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.listMyDonations = asyncHandler(async (req, res) => {
  const data = await donationService.listMyDonations(req.user.id);
  res.json({ success: true, data });
});