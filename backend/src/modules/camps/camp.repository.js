const pool = require('../../config/database');

async function findAll({ latitude, longitude, radiusKm = 50, limit = 50 }) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  if (hasCoords) {
    const { rows } = await pool.query(
      `SELECT
         c.id, c.creator_id, c.title, c.organizer_name, c.contact_phone,
         c.camp_date, c.start_time, c.end_time, c.target_donors,
         c.venue_name, c.venue_address, c.description, c.created_at,
         ST_Y(c.location::geometry) AS latitude,
         ST_X(c.location::geometry) AS longitude,
         ROUND((ST_Distance(c.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000)::numeric, 1) AS distance_km,
         COUNT(ca.id)::int AS pledged_donors
       FROM donation_camps c
       LEFT JOIN camp_attendees ca ON ca.camp_id = c.id
       WHERE c.camp_date >= CURRENT_DATE
         AND ST_DWithin(c.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
       GROUP BY c.id
       ORDER BY c.camp_date ASC, distance_km ASC
       LIMIT $4`,
      [latitude, longitude, radiusKm, limit]
    );
    return rows;
  }

  // Without coordinates, list all upcoming camps
  const { rows } = await pool.query(
    `SELECT
       c.id, c.creator_id, c.title, c.organizer_name, c.contact_phone,
       c.camp_date, c.start_time, c.end_time, c.target_donors,
       c.venue_name, c.venue_address, c.description, c.created_at,
       ST_Y(c.location::geometry) AS latitude,
       ST_X(c.location::geometry) AS longitude,
       COUNT(ca.id)::int AS pledged_donors
     FROM donation_camps c
     LEFT JOIN camp_attendees ca ON ca.camp_id = c.id
     WHERE c.camp_date >= CURRENT_DATE
     GROUP BY c.id
     ORDER BY c.camp_date ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function findById(id, userId = null) {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.creator_id, c.title, c.organizer_name, c.contact_phone,
       c.camp_date, c.start_time, c.end_time, c.target_donors,
       c.venue_name, c.venue_address, c.description, c.created_at,
       ST_Y(c.location::geometry) AS latitude,
       ST_X(c.location::geometry) AS longitude,
       COUNT(ca.id)::int AS pledged_donors,
       EXISTS (
         SELECT 1 FROM camp_attendees
         WHERE camp_id = c.id AND user_id = $2
       ) AS user_pledged
     FROM donation_camps c
     LEFT JOIN camp_attendees ca ON ca.camp_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id, userId || null]
  );
  return rows[0] || null;
}

async function create({
  creatorId,
  title,
  organizerName,
  contactPhone,
  campDate,
  startTime,
  endTime,
  targetDonors = 50,
  venueName,
  venueAddress,
  latitude,
  longitude,
  description,
}) {
  const { rows } = await pool.query(
    `INSERT INTO donation_camps
       (creator_id, title, organizer_name, contact_phone, camp_date, start_time, end_time,
        target_donors, venue_name, venue_address, location, description)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($12, $11), 4326)::geography, $13)
     RETURNING
       id, creator_id, title, organizer_name, contact_phone, camp_date, start_time, end_time,
       target_donors, venue_name, venue_address, description, created_at,
       ST_Y(location::geometry) AS latitude,
       ST_X(location::geometry) AS longitude`,
    [
      creatorId,
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
      description || null,
    ]
  );
  return rows[0];
}

async function pledgeAttendance(campId, userId, bloodGroup = null) {
  const { rows } = await pool.query(
    `INSERT INTO camp_attendees (camp_id, user_id, blood_group)
     VALUES ($1, $2, $3)
     ON CONFLICT (camp_id, user_id) DO NOTHING
     RETURNING id, camp_id, user_id, blood_group, created_at`,
    [campId, userId, bloodGroup || null]
  );
  return rows[0] || null;
}

async function cancelPledge(campId, userId) {
  const { rows } = await pool.query(
    `DELETE FROM camp_attendees
      WHERE camp_id = $1 AND user_id = $2
     RETURNING id`,
    [campId, userId]
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  create,
  pledgeAttendance,
  cancelPledge,
};
