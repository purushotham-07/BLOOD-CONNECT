const donationRepository = require('./donation.repository');
const donorRepository = require('../donors/donor.repository');
const { COMPONENTS } = require('../../constants/enums');
const AppError = require('../../utils/AppError');

// Donors record their own donations here. Verification is a separate admin step.
async function recordDonation(userId, { donationDate, component }) {
  if (!COMPONENTS.includes(component)) {
    throw new AppError(`Invalid component: ${component}`, 400);
  }

  const profile = await donorRepository.findByUserId(userId);
  if (!profile) {
    throw new AppError('Donor profile not found. Create one first.', 404);
  }

  const donation = await donationRepository.create({
    donorProfileId: profile.id,
    donationDate,
    component,
  });

  // Keep the profile's last_donation_date in sync so eligibility is accurate.
  await donorRepository.update(userId, {
    lastDonationDate: donationDate,
  });

  return donation;
}

async function listMyDonations(userId) {
  const profile = await donorRepository.findByUserId(userId);
  if (!profile) {
    throw new AppError('Donor profile not found. Create one first.', 404);
  }
  return donationRepository.listByDonorProfileId(profile.id);
}

module.exports = { recordDonation, listMyDonations };