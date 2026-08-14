const pool = require('../../config/database');

const BASE_SELECT = `
  SELECT
    br.id, br.requester_id, br.blood_group, br.component, br.units_required,
    br.units_fulfilled, br.hospital_name, br.hospital_address, br.urgency, br.status,
    br.description, br.expires_at, br.created_at, br.updated_at,
    u.name AS requester_name, u.phone AS requester_phone,
    ST_Y(br.location::geometry) AS latitude,
    ST_X(br.location::geometry) AS longitude`;

async function create(data) {
  const {
    requesterId, bloodGroup, component, unitsRequired,
    hospitalName, hospitalAddress, latitude, longitude, urgency, description, expiresAt,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO blood_requests
       (requester_id, blood_group, component, units_required, hospital_name,
        hospital_address, location, urgency, status, description, expires_at)
     VALUES
       ($1, $2, $3, $4, $5, $6,
        ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography, $9, 'MATCHING', $10, $11)
     RETURNING id, requester_id, blood_group, component, units_required, units_fulfilled,
               hospital_name, hospital_address, urgency, status, description, expires_at,
               created_at, updated_at,
               ST_Y(location::geometry) AS latitude,
               ST_X(location::geometry) AS longitude`,
    [
      requesterId, bloodGroup, component, unitsRequired, hospitalName,
      hospitalAddress || null, longitude, latitude, urgency,
      description || null, expiresAt || null,
    ]
  );
  return rows[0];
}

async function findAll({ status } = {}) {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = 'WHERE br.status = $1';
  }
  const { rows } = await pool.query(
    `${BASE_SELECT} FROM blood_requests br
     JOIN users u ON u.id = br.requester_id
     ${where}
     ORDER BY br.created_at DESC`,
    params
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(
    `${BASE_SELECT}
       FROM blood_requests br
       JOIN users u ON u.id = br.requester_id
      WHERE br.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updateStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE blood_requests
        SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, requester_id, blood_group, component, units_required, units_fulfilled,
                hospital_name, hospital_address, urgency, status, description,
                expires_at, created_at, updated_at,
                ST_Y(location::geometry) AS latitude,
                ST_X(location::geometry) AS longitude`,
    [id, status]
  );
  return rows[0] || null;
}

module.exports = { create, findAll, findById, updateStatus, BASE_SELECT };