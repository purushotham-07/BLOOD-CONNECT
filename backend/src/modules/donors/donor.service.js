const donorRepository = require('./donor.repository');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { BLOOD_GROUPS } = require('../../constants/enums');

function assertValidBloodGroup(bloodGroup) {
  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    throw new AppError(`Invalid blood group: ${bloodGroup}`, 400);
  }
}

function assertValidCoordinates(latitude, longitude) {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError('Valid numeric latitude (-90 to 90) and longitude (-180 to 180) are required', 400);
  }
}

async function getOrCreateProfile(userId, data) {
  const { bloodGroup, latitude, longitude, available, lastDonationDate, notificationRadius } = data;
  assertValidBloodGroup(bloodGroup);
  
  const numLat = parseFloat(latitude);
  const numLng = parseFloat(longitude);
  assertValidCoordinates(numLat, numLng);

  const existing = await donorRepository.findByUserId(userId);
  if (existing) {
    return donorRepository.update(userId, {
      ...data,
      latitude: numLat,
      longitude: numLng,
    });
  }

  return donorRepository.create({
    userId,
    bloodGroup,
    latitude: numLat,
    longitude: numLng,
    available: available !== false,
    lastDonationDate,
    notificationRadius: notificationRadius ? parseFloat(notificationRadius) : (env.bloodRequestRadiusKm || 10),
  });
}

async function getProfile(userId) {
  const profile = await donorRepository.findByUserId(userId);
  if (!profile) throw new AppError('Donor profile not found. Create one first.', 404);
  return profile;
}

async function updateProfile(userId, data) {
  const existing = await donorRepository.findByUserId(userId);
  if (!existing) throw new AppError('Donor profile not found. Create one first.', 404);

  const { bloodGroup, latitude, longitude } = data;
  if (bloodGroup) assertValidBloodGroup(bloodGroup);
  
  let numLat = latitude !== undefined ? parseFloat(latitude) : undefined;
  let numLng = longitude !== undefined ? parseFloat(longitude) : undefined;
  if (numLat !== undefined && numLng !== undefined) {
    assertValidCoordinates(numLat, numLng);
  }

  return donorRepository.update(userId, {
    ...data,
    latitude: numLat,
    longitude: numLng,
    notificationRadius: data.notificationRadius !== undefined ? parseFloat(data.notificationRadius) : undefined,
  });
}

async function updateAvailability(userId, available) {
  const existing = await donorRepository.findByUserId(userId);
  if (!existing) throw new AppError('Donor profile not found. Create one first.', 404);
  return donorRepository.setAvailability(userId, !!available);
}

/** Persist confirmed donor location to PostgreSQL/PostGIS. */
async function updateLocation(userId, { latitude, longitude }) {
  const numLat = parseFloat(latitude);
  const numLng = parseFloat(longitude);
  assertValidCoordinates(numLat, numLng);
  
  const existing = await donorRepository.findByUserId(userId);
  if (!existing) throw new AppError('Donor profile not found. Create one first.', 404);
  return donorRepository.setLocation(userId, numLat, numLng);
}

/**
 * Server-side eligibility. We compute the next eligible donation date from the
 * configured donation interval and the donor's donation history.
 */
async function getEligibility(userId) {
  const profile = await donorRepository.findByUserId(userId);
  if (!profile) throw new AppError('Donor profile not found. Create one first.', 404);

  const recorded = await donorRepository.getLatestRecordedDonationDate(profile.id);
  const referenceDate = pickMostRecent(profile.last_donation_date, recorded);

  let nextEligibleDate = null;
  if (referenceDate) {
    nextEligibleDate = new Date(referenceDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + env.donationIntervalDays);
  }

  const now = new Date();
  const eligible = !nextEligibleDate || nextEligibleDate <= now;

  return {
    eligible,
    nextEligibleDate: nextEligibleDate ? nextEligibleDate.toISOString().slice(0, 10) : null,
    lastDonationDate: referenceDate,
    intervalDays: env.donationIntervalDays,
    rule: 'Configurable coordination rule based on configured donation interval.',
  };
}

/** Get anonymous spatial donor density map clusters */
async function getDonorDensity(bloodGroup) {
  return donorRepository.getDonorDensity(bloodGroup);
}

function pickMostRecent(...dates) {
  const valid = dates.filter(Boolean);
  if (valid.length === 0) return null;
  return valid.reduce((max, d) => (new Date(d) > new Date(max) ? d : max), valid[0]);
}

module.exports = {
  getOrCreateProfile,
  getProfile,
  updateProfile,
  updateAvailability,
  updateLocation,
  getEligibility,
  getDonorDensity,
};