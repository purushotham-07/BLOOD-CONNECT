const pool = require('../../config/database');

async function findNearby({ latitude, longitude, radiusKm = 50, limit = 30 }) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  if (hasCoords) {
    const { rows } = await pool.query(
      `SELECT
         id, name, address, phone, operating_hours, has_component_facility,
         ST_Y(location::geometry) AS latitude,
         ST_X(location::geometry) AS longitude,
         ROUND((ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000)::numeric, 1) AS distance_km
       FROM blood_banks
       WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
       ORDER BY distance_km ASC
       LIMIT $4`,
      [latitude, longitude, radiusKm, limit]
    );
    return rows;
  }

  // If no coordinates provided, return standard list
  const { rows } = await pool.query(
    `SELECT
       id, name, address, phone, operating_hours, has_component_facility,
       ST_Y(location::geometry) AS latitude,
       ST_X(location::geometry) AS longitude
     FROM blood_banks
     ORDER BY name ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function create({ name, address, phone, operatingHours, latitude, longitude, hasComponentFacility = true }) {
  const { rows } = await pool.query(
    `INSERT INTO blood_banks
       (name, address, phone, operating_hours, location, has_component_facility)
     VALUES
       ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography, $7)
     RETURNING
       id, name, address, phone, operating_hours, has_component_facility,
       ST_Y(location::geometry) AS latitude,
       ST_X(location::geometry) AS longitude`,
    [name, address, phone || null, operatingHours || '24/7 Emergency Service', latitude, longitude, hasComponentFacility]
  );
  return rows[0];
}

module.exports = {
  findNearby,
  create,
};
