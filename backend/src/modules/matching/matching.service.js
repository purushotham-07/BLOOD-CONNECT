const matchingRepository = require('./matching.repository');
const bloodRequestRepository = require('../bloodRequests/bloodRequest.repository');
const donorRepository = require('../donors/donor.repository');
const compatibilityService = require('./compatibility.service');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const {
  emitMatchesUpdated,
  emitRequestUpdated,
  emitUserNotification,
} = require('../../socket');

/**
 * Determine the search radius in meters according to the request urgency level.
 * Configurable from environment, never hardcoded.
 */
function getSearchRadiusMeters(urgency) {
  switch (urgency) {
    case 'CRITICAL':
      return (env.matchingRadiusCriticalKm || 30) * 1000;
    case 'URGENT':
      return (env.matchingRadiusUrgentKm || 20) * 1000;
    case 'NORMAL':
    default:
      return (env.matchingRadiusNormalKm || 10) * 1000;
  }
}

/**
 * Sanitize donor records into safe, privacy-preserving match representations.
 * Explicitly omits exact GPS coordinates, home address, and phone numbers.
 */
function sanitizeMatches(rawDonors) {
  return rawDonors.map((d) => ({
    donorId: d.donor_profile_id,
    donorName: d.donor_name,
    bloodGroup: d.blood_group,
    distanceKm: parseFloat(d.distance_km),
    available: d.available,
    verified: d.verified,
    responseStatus: d.response_status,
    approximateLocation: {
      latitude: parseFloat(d.approx_lat),
      longitude: parseFloat(d.approx_lng),
    },
  }));
}

/**
 * Run the complete matching engine for a blood request.
 */
async function matchRequest(requestId) {
  const request = await bloodRequestRepository.findById(requestId);
  if (!request) throw new AppError('Blood request not found', 404);

  const compatibleGroups = compatibilityService.getCompatibleDonorGroups(
    request.component,
    request.blood_group
  );

  const radiusMeters = getSearchRadiusMeters(request.urgency);

  const rawDonors = await matchingRepository.findCompatibleDonors(
    requestId,
    compatibleGroups,
    radiusMeters,
    env.donationIntervalDays,
    env.matchingResultLimit || 50
  );

  if (rawDonors.length) {
    const ids = rawDonors.map((d) => d.donor_profile_id);
    await matchingRepository.createResponses(requestId, ids);
    await matchingRepository.createNotificationsForMatchedDonors(requestId, ids);

    // Notify matched donors via real-time user sockets
    rawDonors.forEach((d) => {
      emitUserNotification(d.user_id, {
        type: 'NEW_MATCH',
        bloodRequestId: requestId,
        message: `New urgent ${request.blood_group} request at ${request.hospital_name} (${d.distance_km} km away)`,
      });
    });
  }

  const sanitized = sanitizeMatches(rawDonors);

  // Broadcast live matches update over Socket.IO
  emitMatchesUpdated(requestId, sanitized);

  return sanitized;
}

/** Return matching donors for the request owner. Safe sanitized data only. */
async function getMatches(requestId, user) {
  const request = await bloodRequestRepository.findById(requestId);
  if (!request) throw new AppError('Blood request not found', 404);

  if (request.requester_id !== user.id) {
    throw new AppError('Only the requester can view matching donors for this request', 403);
  }

  const compatibleGroups = compatibilityService.getCompatibleDonorGroups(
    request.component,
    request.blood_group
  );
  const radiusMeters = getSearchRadiusMeters(request.urgency);

  const rawDonors = await matchingRepository.findCompatibleDonors(
    requestId,
    compatibleGroups,
    radiusMeters,
    env.donationIntervalDays,
    env.matchingResultLimit || 50
  );

  return sanitizeMatches(rawDonors);
}

/** List all recorded donor responses for a request. */
async function getResponses(requestId, user) {
  const request = await bloodRequestRepository.findById(requestId);
  if (!request) throw new AppError('Blood request not found', 404);

  if (request.requester_id !== user.id) {
    throw new AppError('Only the requester can view donor responses', 403);
  }

  return matchingRepository.listResponsesByRequest(requestId);
}

/** Donor accepts or declines a matched request. */
async function respond(requestId, user, { status }) {
  if (!['ACCEPTED', 'DECLINED'].includes(status)) {
    throw new AppError('Response status must be ACCEPTED or DECLINED', 400);
  }

  const request = await bloodRequestRepository.findById(requestId);
  if (!request) throw new AppError('Blood request not found', 404);

  const profile = await donorRepository.findByUserId(user.id);
  if (!profile) {
    throw new AppError('Please complete your donor profile before responding', 400);
  }

  // 1. Check if donor already responded with ACCEPTED / DECLINED (returns 409)
  const existingResponse = await matchingRepository.findResponse(requestId, profile.id);
  if (existingResponse && (existingResponse.status === 'ACCEPTED' || existingResponse.status === 'DECLINED')) {
    throw new AppError(`You already responded with ${existingResponse.status}`, 409);
  }

  // 2. Verify blood group compatibility
  const isComp = compatibilityService.isCompatible(
    profile.blood_group,
    request.blood_group,
    request.component
  );
  if (!isComp) {
    throw new AppError(
      `Your blood group (${profile.blood_group}) is not compatible with this request (${request.blood_group} ${request.component})`,
      403
    );
  }

  // 3. Verify request is in active/matching state
  if (!['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED'].includes(request.status)) {
    throw new AppError(`Cannot respond to a request in status ${request.status}`, 400);
  }

  let result;
  if (status === 'ACCEPTED') {
    result = await matchingRepository.acceptResponse(requestId, profile.id);

    // Notify the requester
    await matchingRepository.createNotification({
      userId: request.requester_id,
      bloodRequestId: requestId,
      type: 'RESPONSE_RECEIVED',
    });

    emitUserNotification(request.requester_id, {
      type: 'RESPONSE_RECEIVED',
      bloodRequestId: requestId,
      message: `A compatible donor (${profile.blood_group}) accepted your blood request for ${request.hospital_name}!`,
    });

    // Emit live request update (units fulfilled, new status)
    emitRequestUpdated(requestId, result.request);
  } else {
    result = await matchingRepository.declineResponse(requestId, profile.id);
    if (!result) {
      throw new AppError('Could not decline this request', 400);
    }
  }

  // Refresh and broadcast updated matches
  const compatibleGroups = compatibilityService.getCompatibleDonorGroups(
    request.component,
    request.blood_group
  );
  const radiusMeters = getSearchRadiusMeters(request.urgency);
  const updatedDonors = await matchingRepository.findCompatibleDonors(
    requestId,
    compatibleGroups,
    radiusMeters,
    env.donationIntervalDays,
    env.matchingResultLimit || 50
  );
  const sanitized = sanitizeMatches(updatedDonors);
  emitMatchesUpdated(requestId, sanitized);

  return result;
}

/** Retrieve all matched blood requests for a donor */
async function getMatchedRequestsForDonor(user) {
  const profile = await donorRepository.findByUserId(user.id);
  if (!profile) throw new AppError('Donor profile not found', 404);

  return matchingRepository.findMatchedRequestsForDonor(profile.id);
}

module.exports = {
  matchRequest,
  getMatches,
  getResponses,
  respond,
  getMatchedRequestsForDonor,
  getSearchRadiusMeters,
  sanitizeMatches,
};