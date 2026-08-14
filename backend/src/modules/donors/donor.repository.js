const pool = require('../../config/database');

const SAFE_COLUMNS = `
  id, user_id, blood_group, available, last_donation_date,
  notification_radius, verified, created_at, updated_at,
  ST_X(location::geometry) AS longitude,
  ST_Y(location::geometry) AS latitude`;

async function findByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM donor_profiles WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM donor_profiles WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function create({ userId, bloodGroup, latitude, longitude, available = true, lastDonationDate, notificationRadius = 10 }) {
  const { rows } = await pool.query(
    `INSERT INTO donor_profiles
       (user_id, blood_group, location, available, last_donation_date, notification_radius, verified)
     VALUES
       ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, true)
     RETURNING ${SAFE_COLUMNS}`,
    [
      userId,
      bloodGroup,
      longitude,
      latitude,
      available !== false,
      lastDonationDate || null,
      notificationRadius,
    ]
  );
  return rows[0];
}

async function update(userId, { bloodGroup, latitude, longitude, available, lastDonationDate, notificationRadius }) {
  let locationClause = 'location = location';
  const params = [userId, bloodGroup, available, lastDonationDate || null, notificationRadius];
  
  if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
    params.push(longitude, latitude);
    locationClause = `location = ST_SetSRID(ST_MakePoint($${params.length - 1}, $${params.length}), 4326)::geography`;
  }

  const { rows } = await pool.query(
    `UPDATE donor_profiles
        SET blood_group = COALESCE($2, blood_group),
            available = COALESCE($3, available),
            last_donation_date = COALESCE($4, last_donation_date),
            notification_radius = COALESCE($5, notification_radius),
            ${locationClause},
            updated_at = now()
      WHERE user_id = $1
      RETURNING ${SAFE_COLUMNS}`,
    params
  );
  return rows[0] || null;
}

async function setAvailability(userId, available) {
  const { rows } = await pool.query(
    `UPDATE donor_profiles
        SET available = $2, updated_at = now()
      WHERE user_id = $1
      RETURNING ${SAFE_COLUMNS}`,
    [userId, available]
  );
  return rows[0] || null;
}

async function setLocation(userId, latitude, longitude) {
  const { rows } = await pool.query(
    `UPDATE donor_profiles
        SET location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
            updated_at = now()
      WHERE user_id = $1
      RETURNING ${SAFE_COLUMNS}`,
    [userId, longitude, latitude]
  );
  return rows[0] || null;
}

async function getLatestRecordedDonationDate(donorProfileId) {
  const { rows } = await pool.query(
    `SELECT MAX(donation_date) AS latest_date
       FROM donations WHERE donor_id = $1`,
    [donorProfileId]
  );
  return rows[0]?.latest_date || null;
}

/**
 * Aggregated spatial donor density clusters using PostGIS ST_SnapToGrid.
 * Strictly preserves privacy by returning cluster centers and counts only.
 */
async function getDonorDensity(bloodGroup = null) {
  const { rows } = await pool.query(
    `SELECT
       ROUND(ST_Y(ST_SnapToGrid(location::geometry, 0.035))::numeric, 4) AS cluster_lat,
       ROUND(ST_X(ST_SnapToGrid(location::geometry, 0.035))::numeric, 4) AS cluster_lng,
       COUNT(*)::int AS donor_count,
       blood_group
     FROM donor_profiles
     WHERE available = true AND verified = true
       AND ($1::varchar IS NULL OR blood_group = $1)
     GROUP BY cluster_lat, cluster_lng, blood_group
     HAVING COUNT(*) > 0`,
    [bloodGroup || null]
  );
  return rows;
}

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  setAvailability,
  setLocation,
  getLatestRecordedDonationDate,
  getDonorDensity,
};