const pool = require('../../config/database');

/**
 * Find compatible, available, verified, eligible donors within the search radius of a
 * request. All geographic filtering and distance computation happens directly in PostGIS.
 */
async function findCompatibleDonors(requestId, compatibleGroups, radiusMeters, intervalDays, limit = 50) {
  const { rows } = await pool.query(
    `SELECT
       dp.id AS donor_profile_id,
       dp.user_id,
       dp.blood_group,
       dp.notification_radius,
       dp.available,
       dp.verified,
       u.name AS donor_name,
       ROUND((ST_Distance(dp.location::geography, br.location::geography) / 1000)::numeric, 1) AS distance_km,
       COALESCE(dr.status, 'NOTIFIED') AS response_status,
       ROUND((ST_Y(dp.location::geometry) + ((('x' || substr(md5(dp.id::text || br.id::text), 1, 4))::bit(16)::int % 200 - 100) * 0.00003))::numeric, 4) AS approx_lat,
       ROUND((ST_X(dp.location::geometry) + ((('x' || substr(md5(br.id::text || dp.id::text), 1, 4))::bit(16)::int % 200 - 100) * 0.00003))::numeric, 4) AS approx_lng
     FROM donor_profiles dp
     JOIN users u ON u.id = dp.user_id
     JOIN blood_requests br ON br.id = $1
     LEFT JOIN donor_responses dr
       ON dr.blood_request_id = br.id AND dr.donor_id = dp.id
     WHERE br.id = $1
       AND dp.verified = true
       AND dp.available = true
       AND dp.blood_group = ANY($2)
       AND ST_DWithin(dp.location::geography, br.location::geography, $3)
       AND (dp.notification_radius * 1000) >= ST_Distance(dp.location::geography, br.location::geography)
       AND (dp.last_donation_date IS NULL
            OR dp.last_donation_date <= CURRENT_DATE - make_interval(days => $4))
       AND (dr.status IS NULL OR dr.status <> 'DECLINED')
     ORDER BY distance_km ASC
     LIMIT $5`,
    [requestId, compatibleGroups, radiusMeters, intervalDays, limit]
  );
  return rows;
}

/** Insert NOTIFIED responses for matched donors. DB unique constraint prevents duplicates. */
async function createResponses(requestId, donorProfileIds) {
  if (!donorProfileIds.length) return [];
  const { rows } = await pool.query(
    `INSERT INTO donor_responses (blood_request_id, donor_id, status)
     SELECT $1, dp.id, 'NOTIFIED'
       FROM donor_profiles dp
      WHERE dp.id = ANY($2)
     ON CONFLICT (blood_request_id, donor_id) DO NOTHING
     RETURNING id, blood_request_id, donor_id, status`,
    [requestId, donorProfileIds]
  );
  return rows;
}

async function createNotificationsForMatchedDonors(requestId, donorProfileIds) {
  if (!donorProfileIds.length) return;
  await pool.query(
    `INSERT INTO notifications (user_id, blood_request_id, type)
     SELECT dp.user_id, $1, 'NEW_MATCH'
       FROM donor_profiles dp
      WHERE dp.id = ANY($2)`,
    [requestId, donorProfileIds]
  );
}

async function createNotification({ userId, bloodRequestId, type }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, blood_request_id, type)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, blood_request_id, type, status, sent_at, created_at`,
    [userId, bloodRequestId, type]
  );
  return rows[0];
}

async function findResponse(requestId, donorProfileId) {
  const { rows } = await pool.query(
    `SELECT id, blood_request_id, donor_id, status, responded_at, created_at, updated_at
       FROM donor_responses
      WHERE blood_request_id = $1 AND donor_id = $2`,
    [requestId, donorProfileId]
  );
  return rows[0] || null;
}

async function updateResponseStatus(requestId, donorProfileId, status) {
  const { rows } = await pool.query(
    `UPDATE donor_responses
        SET status = $3, responded_at = now(), updated_at = now()
      WHERE blood_request_id = $1 AND donor_id = $2
      RETURNING id, blood_request_id, donor_id, status, responded_at, updated_at`,
    [requestId, donorProfileId, status]
  );
  return rows[0] || null;
}

/**
 * Accept a matched request atomically.
 * Steps (single transaction with row-level lock):
 *  1. Ensure response record exists.
 *  2. Mark the donor response ACCEPTED.
 *  3. Claim one fulfilled unit (UPDATE ... WHERE units_fulfilled < units_required).
 *  4. Advance the request status (PARTIALLY_FULFILLED / FULFILLED).
 */
async function acceptResponse(requestId, donorProfileId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the blood request row to prevent race conditions
    const reqRes = await client.query(
      `SELECT id, units_required, units_fulfilled, status
         FROM blood_requests
        WHERE id = $1
        FOR UPDATE`,
      [requestId]
    );

    if (!reqRes.rows[0]) {
      const err = new Error('Blood request not found');
      err.statusCode = 404;
      throw err;
    }

    const currentReq = reqRes.rows[0];
    if (!['ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED'].includes(currentReq.status)) {
      const err = new Error(`Request is already ${currentReq.status}`);
      err.statusCode = 400;
      throw err;
    }

    if (currentReq.units_fulfilled >= currentReq.units_required) {
      const err = new Error('This blood request has already been completely fulfilled');
      err.statusCode = 409;
      throw err;
    }

    // Ensure a donor_response row exists for this donor (insert if volunteered directly)
    await client.query(
      `INSERT INTO donor_responses (blood_request_id, donor_id, status)
       VALUES ($1, $2, 'NOTIFIED')
       ON CONFLICT (blood_request_id, donor_id) DO NOTHING`,
      [requestId, donorProfileId]
    );

    // 2. Mark donor response as ACCEPTED
    const resp = await client.query(
      `UPDATE donor_responses
          SET status = 'ACCEPTED', responded_at = now(), updated_at = now()
        WHERE blood_request_id = $1 AND donor_id = $2
          AND status IN ('NOTIFIED', 'VIEWED')
        RETURNING id, blood_request_id, donor_id, status`,
      [requestId, donorProfileId]
    );

    if (!resp.rows[0]) {
      const err = new Error('You have already responded to this blood request');
      err.statusCode = 409;
      throw err;
    }

    // 3. Increment units fulfilled
    const newFulfilled = currentReq.units_fulfilled + 1;
    const nextStatus =
      newFulfilled >= currentReq.units_required
        ? 'FULFILLED'
        : 'PARTIALLY_FULFILLED';

    const updatedReqRes = await client.query(
      `UPDATE blood_requests
          SET units_fulfilled = $2,
              status = $3,
              updated_at = now()
        WHERE id = $1
        RETURNING id, units_required, units_fulfilled, status, requester_id, hospital_name, blood_group`,
      [requestId, newFulfilled, nextStatus]
    );

    await client.query('COMMIT');
    return {
      response: resp.rows[0],
      request: updatedReqRes.rows[0],
      unitsFulfilled: newFulfilled,
      unitsRequired: currentReq.units_required,
      status: nextStatus,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Decline a matched request */
async function declineResponse(requestId, donorProfileId) {
  await pool.query(
    `INSERT INTO donor_responses (blood_request_id, donor_id, status)
     VALUES ($1, $2, 'NOTIFIED')
     ON CONFLICT (blood_request_id, donor_id) DO NOTHING`,
    [requestId, donorProfileId]
  );

  const { rows } = await pool.query(
    `UPDATE donor_responses
        SET status = 'DECLINED', responded_at = now(), updated_at = now()
      WHERE blood_request_id = $1 AND donor_id = $2
        AND status IN ('NOTIFIED', 'VIEWED')
      RETURNING id, blood_request_id, donor_id, status`,
    [requestId, donorProfileId]
  );
  return rows[0] || null;
}

async function listResponsesByRequest(requestId) {
  const { rows } = await pool.query(
    `SELECT dr.id, dr.blood_request_id, dr.donor_id, dr.status, dr.responded_at,
            u.name AS donor_name, dp.blood_group
       FROM donor_responses dr
       JOIN donor_profiles dp ON dp.id = dr.donor_id
       JOIN users u ON u.id = dp.user_id
      WHERE dr.blood_request_id = $1
      ORDER BY dr.created_at ASC`,
    [requestId]
  );
  return rows;
}

/** Find all active matched requests for a donor */
async function findMatchedRequestsForDonor(donorProfileId) {
  const { rows } = await pool.query(
    `SELECT
       br.id, br.blood_group, br.component, br.units_required, br.units_fulfilled,
       br.hospital_name, br.hospital_address, br.urgency, br.status, br.description,
       br.expires_at, br.created_at,
       dr.status AS response_status, dr.responded_at,
       ROUND((ST_Distance(dp.location::geography, br.location::geography) / 1000)::numeric, 1) AS distance_km
     FROM donor_responses dr
     JOIN blood_requests br ON br.id = dr.blood_request_id
     JOIN donor_profiles dp ON dp.id = dr.donor_id
     WHERE dr.donor_id = $1
       AND br.status IN ('ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED')
       AND (dr.status IS NULL OR dr.status <> 'DECLINED')
     ORDER BY dr.created_at DESC`,
    [donorProfileId]
  );
  return rows;
}

module.exports = {
  findCompatibleDonors,
  createResponses,
  createNotificationsForMatchedDonors,
  createNotification,
  findResponse,
  updateResponseStatus,
  acceptResponse,
  declineResponse,
  listResponsesByRequest,
  findMatchedRequestsForDonor,
};