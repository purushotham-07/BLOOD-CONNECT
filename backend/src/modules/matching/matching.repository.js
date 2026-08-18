const pool = require('../../config/database');

/** Find all compatible, available, eligible donors within the given search radius */
async function findCompatibleDonors(
  requestId,
  compatibleBloodGroups,
  radiusMeters,
  donationIntervalDays = 56,
  limit = 50
) {
  const query = `
    SELECT
      dp.id AS donor_profile_id,
      dp.user_id,
      u.name AS donor_name,
      dp.blood_group,
      dp.notification_radius,
      ST_Y(dp.location::geometry) AS latitude,
      ST_X(dp.location::geometry) AS longitude,
      ROUND((ST_Distance(dp.location, br.location) / 1000)::numeric, 1) AS distance_km,
      dr.status AS response_status
    FROM donor_profiles dp
    JOIN users u ON u.id = dp.user_id
    JOIN blood_requests br ON br.id = $1
    LEFT JOIN donor_responses dr
      ON dr.blood_request_id = br.id AND dr.donor_id = dp.id
    WHERE
      dp.available = true
      AND dp.blood_group = ANY($2::varchar[])
      AND (
        dp.last_donation_date IS NULL
        OR dp.last_donation_date <= (CURRENT_DATE - INTERVAL '1 day' * $4)
      )
      AND ST_DWithin(dp.location, br.location, $3)
      AND ST_DWithin(dp.location, br.location, dp.notification_radius * 1000)
    ORDER BY
      CASE
        WHEN dp.blood_group = br.blood_group THEN 0
        ELSE 1
      END,
      ST_Distance(dp.location, br.location) ASC
    LIMIT $5;
  `;

  const { rows } = await pool.query(query, [
    requestId,
    compatibleBloodGroups,
    radiusMeters,
    donationIntervalDays,
    limit,
  ]);
  return rows;
}

/** Create or update notification records for matched donors */
async function createNotificationsForMatchedDonors(requestId, donorProfileIds) {
  if (!donorProfileIds.length) return [];

  const values = donorProfileIds
    .map(
      (id) =>
        `((SELECT user_id FROM donor_profiles WHERE id = '${id}'), '${requestId}', 'NEW_MATCH')`
    )
    .join(', ');

  const query = `
    INSERT INTO notifications (user_id, blood_request_id, type)
    VALUES ${values}
    ON CONFLICT DO NOTHING
    RETURNING id, user_id, blood_request_id, type, created_at;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

/** Create initial NOTIFIED response entries for matched donors */
async function createResponses(requestId, donorProfileIds) {
  if (!donorProfileIds.length) return [];

  const values = donorProfileIds
    .map((id) => `('${requestId}', '${id}', 'NOTIFIED')`)
    .join(', ');

  const query = `
    INSERT INTO donor_responses (blood_request_id, donor_id, status)
    VALUES ${values}
    ON CONFLICT (blood_request_id, donor_id) DO NOTHING
    RETURNING id, blood_request_id, donor_id, status;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

/** Donor accepts a matched blood request. Marks status as ACCEPTED. */
async function acceptResponse(requestId, donorProfileId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the blood request row
    const reqRes = await client.query(
      `SELECT id, units_required, units_fulfilled, status, requester_id, hospital_name, blood_group
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

    // Ensure a donor_response row exists for this donor (insert if volunteered directly)
    await client.query(
      `INSERT INTO donor_responses (blood_request_id, donor_id, status)
       VALUES ($1, $2, 'NOTIFIED')
       ON CONFLICT (blood_request_id, donor_id) DO NOTHING`,
      [requestId, donorProfileId]
    );

    // 2. Mark donor response as ACCEPTED (Donor pledged to donate)
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

    await client.query('COMMIT');
    return {
      response: resp.rows[0],
      request: currentReq,
      status: currentReq.status,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Complete an actual physical donation of 1 unit. */
async function completeDonation(requestId, donorProfileId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock the blood request row
    const reqRes = await client.query(
      `SELECT id, units_required, units_fulfilled, status, requester_id, hospital_name, blood_group, component
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
    if (currentReq.units_fulfilled >= currentReq.units_required) {
      const err = new Error('This blood request is already completely fulfilled');
      err.statusCode = 409;
      throw err;
    }

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
        RETURNING id, units_required, units_fulfilled, status, requester_id, hospital_name, blood_group, component`,
      [requestId, newFulfilled, nextStatus]
    );

    // If a donor profile is linked, record official donation and reset donation interval
    if (donorProfileId) {
      await client.query(
        `INSERT INTO donations (donor_profile_id, donation_date, component)
         VALUES ($1, CURRENT_DATE, $2)
         ON CONFLICT DO NOTHING`,
        [donorProfileId, currentReq.component]
      );

      await client.query(
        `UPDATE donor_profiles
            SET last_donation_date = CURRENT_DATE, updated_at = now()
          WHERE id = $1`,
        [donorProfileId]
      );
    }

    await client.query('COMMIT');
    return {
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

/** List all donor responses for a blood request */
async function listResponsesByRequest(requestId) {
  const { rows } = await pool.query(
    `SELECT
       dr.id, dr.blood_request_id, dr.donor_id, dr.status, dr.responded_at,
       u.name AS donor_name, dp.blood_group,
       ROUND((ST_Distance(dp.location, br.location) / 1000)::numeric, 1) AS distance_km
     FROM donor_responses dr
     JOIN donor_profiles dp ON dp.id = dr.donor_id
     JOIN users u ON u.id = dp.user_id
     JOIN blood_requests br ON br.id = dr.blood_request_id
     WHERE dr.blood_request_id = $1
     ORDER BY dr.responded_at DESC NULLS LAST, dr.created_at ASC`,
    [requestId]
  );
  return rows;
}

/** Retrieve all matched requests for a specific donor */
async function findMatchedRequestsForDonor(donorProfileId) {
  const { rows } = await pool.query(
    `SELECT
       br.id, br.blood_group, br.component, br.units_required, br.units_fulfilled,
       br.hospital_name, br.hospital_address, br.urgency, br.status,
       br.description, br.created_at,
       dr.status AS response_status,
       ROUND((ST_Distance(dp.location, br.location) / 1000)::numeric, 1) AS distance_km,
       ST_Y(br.location::geometry) AS latitude,
       ST_X(br.location::geometry) AS longitude
     FROM donor_responses dr
     JOIN blood_requests br ON br.id = dr.blood_request_id
     JOIN donor_profiles dp ON dp.id = dr.donor_id
     WHERE dr.donor_id = $1
       AND br.status IN ('ACTIVE', 'MATCHING', 'PARTIALLY_FULFILLED')
     ORDER BY
       CASE br.urgency
         WHEN 'CRITICAL' THEN 1
         WHEN 'URGENT' THEN 2
         ELSE 3
       END,
       br.created_at DESC`,
    [donorProfileId]
  );
  return rows;
}

async function findResponse(requestId, donorProfileId) {
  const { rows } = await pool.query(
    `SELECT * FROM donor_responses
      WHERE blood_request_id = $1 AND donor_id = $2`,
    [requestId, donorProfileId]
  );
  return rows[0] || null;
}

async function createNotification({ userId, bloodRequestId, type }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, blood_request_id, type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, bloodRequestId, type]
  );
  return rows[0];
}

module.exports = {
  findCompatibleDonors,
  createNotificationsForMatchedDonors,
  createResponses,
  acceptResponse,
  completeDonation,
  declineResponse,
  listResponsesByRequest,
  findMatchedRequestsForDonor,
  findResponse,
  createNotification,
};