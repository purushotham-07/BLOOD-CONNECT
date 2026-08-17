const campRepository = require('./camp.repository');
const donorRepository = require('../donors/donor.repository');
const AppError = require('../../utils/AppError');

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

async function listCamps(query = {}) {
  const latitude = query.latitude !== undefined && query.latitude !== '' ? parseFloat(query.latitude) : undefined;
  const longitude = query.longitude !== undefined && query.longitude !== '' ? parseFloat(query.longitude) : undefined;
  const radiusKm = query.radius ? parseFloat(query.radius) : 50;

  return campRepository.findAll({
    latitude,
    longitude,
    radiusKm,
    limit: 50,
  });
}

async function getCamp(id, user = null) {
  const camp = await campRepository.findById(id, user?.id);
  if (!camp) throw new AppError('Blood donation camp not found', 404);
  return camp;
}

async function createCamp(creatorId, data) {
  const {
    title,
    organizerName,
    contactPhone,
    campDate,
    startTime,
    endTime,
    targetDonors,
    venueName,
    venueAddress,
    latitude,
    longitude,
    description,
  } = data;

  if (!title || !String(title).trim()) throw new AppError('Title is required', 400);
  if (!organizerName || !String(organizerName).trim()) throw new AppError('Organizer name is required', 400);
  if (!contactPhone || !String(contactPhone).trim()) throw new AppError('Contact phone is required', 400);
  if (!campDate) throw new AppError('Camp date is required', 400);
  if (!startTime || !endTime) throw new AppError('Start and end times are required', 400);
  if (!venueName || !venueAddress) throw new AppError('Venue name and address are required', 400);

  const numLat = parseFloat(latitude);
  const numLng = parseFloat(longitude);
  assertValidCoordinates(numLat, numLng);

  return campRepository.create({
    creatorId,
    title: String(title).trim(),
    organizerName: String(organizerName).trim(),
    contactPhone: String(contactPhone).trim(),
    campDate,
    startTime: String(startTime).trim(),
    endTime: String(endTime).trim(),
    targetDonors: targetDonors ? parseInt(targetDonors, 10) : 50,
    venueName: String(venueName).trim(),
    venueAddress: String(venueAddress).trim(),
    latitude: numLat,
    longitude: numLng,
    description: description ? String(description).trim() : null,
  });
}

async function pledgeAttendance(campId, user) {
  const camp = await campRepository.findById(campId);
  if (!camp) throw new AppError('Blood donation camp not found', 404);

  // Look up donor's blood group if registered as donor
  let bloodGroup = null;
  if (user.role === 'DONOR') {
    const profile = await donorRepository.findByUserId(user.id);
    if (profile) bloodGroup = profile.blood_group;
  }

  const result = await campRepository.pledgeAttendance(campId, user.id, bloodGroup);
  if (!result) {
    throw new AppError('You have already pledged attendance for this donation camp', 409);
  }
  return result;
}

async function cancelPledge(campId, user) {
  const result = await campRepository.cancelPledge(campId, user.id);
  if (!result) {
    throw new AppError('You have not pledged attendance for this camp', 400);
  }
  return { success: true };
}

module.exports = {
  listCamps,
  getCamp,
  createCamp,
  pledgeAttendance,
  cancelPledge,
};
