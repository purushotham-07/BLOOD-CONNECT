const userRepository = require('./user.repository');
const AppError = require('../../utils/AppError');

function assertValidCoords(latitude, longitude) {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError('Valid latitude (-90 to 90) and longitude (-180 to 180) are required', 400);
  }
}

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function updateProfile(userId, data) {
  const user = await userRepository.updateProfile(userId, data);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function getLocation(userId) {
  const location = await userRepository.getLocation(userId);
  return location || { latitude: null, longitude: null };
}

async function setLocation(userId, { latitude, longitude }) {
  assertValidCoords(latitude, longitude);
  const location = await userRepository.setLocation(userId, latitude, longitude);
  if (!location) throw new AppError('User not found', 404);
  return location;
}

module.exports = { getProfile, updateProfile, getLocation, setLocation };