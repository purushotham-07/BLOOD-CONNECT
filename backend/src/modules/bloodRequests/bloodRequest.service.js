const bloodRequestRepository = require('./bloodRequest.repository');
const matchingService = require('../matching/matching.service');
const AppError = require('../../utils/AppError');
const { BLOOD_GROUPS, COMPONENTS, URGENCY, canTransition } = require('../../constants/enums');

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

async function createRequest(requesterId, data) {
  const { bloodGroup, component, unitsRequired, hospitalName, latitude, longitude } = data;

  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    throw new AppError(`Invalid blood group: ${bloodGroup}`, 400);
  }
  if (!COMPONENTS.includes(component)) {
    throw new AppError(`Invalid component: ${component}`, 400);
  }
  const urgencyVal = data.urgency || 'NORMAL';
  if (!URGENCY.includes(urgencyVal)) {
    throw new AppError(`Invalid urgency: ${urgencyVal}`, 400);
  }
  if (!Number.isInteger(unitsRequired) || unitsRequired < 1) {
    throw new AppError('unitsRequired must be a positive integer', 400);
  }
  if (!hospitalName || !String(hospitalName).trim()) {
    throw new AppError('hospitalName is required', 400);
  }

  const numLat = parseFloat(latitude);
  const numLng = parseFloat(longitude);
  assertValidCoordinates(numLat, numLng);

  const request = await bloodRequestRepository.create({
    requesterId,
    bloodGroup,
    component,
    unitsRequired,
    hospitalName: String(hospitalName).trim(),
    hospitalAddress: data.hospitalAddress ? String(data.hospitalAddress).trim() : null,
    latitude: numLat,
    longitude: numLng,
    urgency: urgencyVal,
    description: data.description ? String(data.description).trim() : null,
    expiresAt: data.expiresAt || null,
  });

  // Automatically trigger PostGIS matching engine immediately upon creation
  try {
    const matches = await matchingService.matchRequest(request.id);
    request.matches = matches;
  } catch (err) {
    console.error('Error during initial request matching:', err);
  }

  return request;
}

async function listRequests(user) {
  const rows = await bloodRequestRepository.findAll();

  // Requesters see their own requests; donors see active/matching requests that need donors.
  return rows.filter((r) => {
    if (user.role === 'REQUESTER') {
      return r.requester_id === user.id;
    }
    // DONOR can browse active and fulfilled requests
    return ['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED', 'FULFILLED'].includes(r.status);
  });
}

async function getRequest(id, user) {
  const request = await bloodRequestRepository.findById(id);
  if (!request) throw new AppError('Blood request not found', 404);
  return request;
}

/**
 * Cancel a request. Only the requester may cancel, and only from a state that permits it.
 */
async function cancelRequest(id, user) {
  const request = await bloodRequestRepository.findById(id);
  if (!request) throw new AppError('Blood request not found', 404);

  if (request.requester_id !== user.id) {
    throw new AppError('You are not allowed to cancel this request', 403);
  }

  if (!canTransition(request.status, 'CANCELLED')) {
    throw new AppError(
      `Cannot cancel a request in status ${request.status}`,
      400
    );
  }

  return bloodRequestRepository.updateStatus(id, 'CANCELLED');
}

module.exports = {
  createRequest,
  listRequests,
  getRequest,
  cancelRequest,
};