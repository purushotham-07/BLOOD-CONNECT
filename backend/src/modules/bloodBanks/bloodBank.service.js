const bloodBankRepository = require('./bloodBank.repository');

async function listBloodBanks(query = {}) {
  const latitude = query.latitude ? parseFloat(query.latitude) : undefined;
  const longitude = query.longitude ? parseFloat(query.longitude) : undefined;
  const radiusKm = query.radius ? parseFloat(query.radius) : 50;

  return bloodBankRepository.findNearby({
    latitude,
    longitude,
    radiusKm,
    limit: 50,
  });
}

module.exports = {
  listBloodBanks,
};
